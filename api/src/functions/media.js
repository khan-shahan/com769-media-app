// api/src/functions/media.js
const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");
const { v4: uuidv4 } = require("uuid");
const {
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

/* ---------------------- helpers ---------------------- */

function mustGet(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getMediaContainer() {
  const client = new CosmosClient(mustGet("COSMOS_CONNECTION_STRING"));
  const db = client.database(mustGet("COSMOS_DATABASE_NAME"));
  return db.container(mustGet("COSMOS_CONTAINER_MEDIA"));
}

// Parse AccountName + AccountKey out of STORAGE_CONNECTION_STRING
function parseStorageConnStr(connStr) {
  const parts = connStr.split(";").filter(Boolean);
  const map = {};
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx > 0) map[p.slice(0, idx)] = p.slice(idx + 1);
  }
  const account = map["AccountName"];
  const key = map["AccountKey"];
  if (!account || !key)
    throw new Error("STORAGE_CONNECTION_STRING missing AccountName/AccountKey");
  return { account, key };
}

function parseBlobUrl(blobUrl) {
  const u = new URL(blobUrl);
  const parts = u.pathname.split("/").filter(Boolean);
  const containerName = parts.shift();
  const blobName = parts.join("/");
  return { containerName, blobName };
}

function toReadSasUrl(blobUrl, minutes = 60) {
  const connStr = mustGet("STORAGE_CONNECTION_STRING");
  const { account, key } = parseStorageConnStr(connStr);
  const { containerName, blobName } = parseBlobUrl(blobUrl);

  const credential = new StorageSharedKeyCredential(account, key);
  const expiresOn = new Date(Date.now() + minutes * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn,
    },
    credential
  ).toString();

  return `https://${account}.blob.core.windows.net/${containerName}/${blobName}?${sas}`;
}

function addAccessUrl(item) {
  if (!item?.blobUrl) return { ...item, accessUrl: null };
  try {
    return { ...item, accessUrl: toReadSasUrl(item.blobUrl, 60) };
  } catch {
    return { ...item, accessUrl: null };
  }
}

/* ---------------------- function ---------------------- */

app.http("media", {
  route: "media",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const container = getMediaContainer();

      // -----------------------
      // GET /api/media?q=...
      // -----------------------
      if (request.method === "GET") {
        const url = new URL(request.url);
        const qRaw = (url.searchParams.get("q") || "").trim();
        const hasSearch = qRaw.length > 0;
        const q = qRaw.toLowerCase();

        let queryText;
        let parameters = [];

        // Always hide items where deleted === true
        if (hasSearch) {
          queryText =
            "SELECT * FROM c " +
            "WHERE (NOT IS_DEFINED(c.deleted) OR c.deleted != true) " +
            "AND (IS_DEFINED(c.title) AND CONTAINS(LOWER(c.title), @q)) " +
            "ORDER BY c.createdAt DESC";
          parameters = [{ name: "@q", value: q }];
        } else {
          queryText =
            "SELECT * FROM c " +
            "WHERE (NOT IS_DEFINED(c.deleted) OR c.deleted != true) " +
            "ORDER BY c.createdAt DESC";
        }

        const querySpec = { query: queryText, parameters };
        const { resources } = await container.items.query(querySpec).fetchAll();

        // add SAS read URLs so thumbnails & videos work
        const itemsWithSas = (resources || []).map(addAccessUrl);

        return { status: 200, jsonBody: itemsWithSas };
      }

      // -----------------------
      // POST /api/media
      // -----------------------
      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));

        const title = (body.title || "").toString().trim();
        const mediaType = (body.mediaType || "").toString().trim();
        const blobUrl = (body.blobUrl || "").toString().trim();
        const caption = (body.caption || "").toString();
        const location = (body.location || "").toString();
        const people = Array.isArray(body.people) ? body.people : [];

        const ownerId = body.ownerId || null;
        const ownerUsername = body.ownerUsername || null;

        if (!title || !mediaType || !blobUrl) {
          return {
            status: 400,
            jsonBody: {
              error: "BadRequest",
              message: "Required fields: title, mediaType, blobUrl",
            },
          };
        }

        const now = new Date().toISOString();
        const id = uuidv4();

        const item = {
          id,
          title,
          mediaType,
          blobUrl,
          caption,
          location,
          people,
          ownerId,
          ownerUsername,
          createdAt: now,
          updatedAt: now,
          // deleted omitted => active item
        };

        await container.items.create(item, { partitionKey: id });

        return { status: 201, jsonBody: addAccessUrl(item) };
      }

      return { status: 405, jsonBody: { error: "Method not allowed" } };
    } catch (err) {
      context.error(err);
      return {
        status: 500,
        jsonBody: { error: "Server error", message: err.message },
      };
    }
  },
});
