const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");
const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

// --------------------
// helpers
// --------------------
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
    if (idx > 0) {
      const k = p.slice(0, idx);
      const v = p.slice(idx + 1);
      map[k] = v;
    }
  }
  const account = map["AccountName"];
  const key = map["AccountKey"];
  if (!account || !key) throw new Error("STORAGE_CONNECTION_STRING missing AccountName/AccountKey");
  return { account, key };
}

function parseBlobUrl(blobUrl) {
  // https://{account}.blob.core.windows.net/{container}/{blobName}
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
  if (!item || !item.blobUrl) return { ...item, accessUrl: null };
  try {
    return { ...item, accessUrl: toReadSasUrl(item.blobUrl, 60) };
  } catch {
    return { ...item, accessUrl: null };
  }
}

// --------------------
// HTTP function
// --------------------
app.http("media", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "media",
  handler: async (req) => {
    const container = getMediaContainer();

    // --------------------
    // GET /api/media
    // --------------------
    if (req.method === "GET") {
      const q = (req.query.get("q") || "").trim().toLowerCase();

      const querySpec = {
        query: "SELECT * FROM c ORDER BY c.createdAt DESC",
      };

      const { resources } = await container.items.query(querySpec).fetchAll();
      let items = Array.isArray(resources) ? resources : [];

      if (q) {
        items = items.filter((m) => {
          const title = (m.title || "").toLowerCase();
          const caption = (m.caption || "").toLowerCase();
          const location = (m.location || "").toLowerCase();
          const people = Array.isArray(m.people) ? m.people.join(",").toLowerCase() : "";
          return (
            title.includes(q) ||
            caption.includes(q) ||
            location.includes(q) ||
            people.includes(q)
          );
        });
      }

      return {
        status: 200,
        jsonBody: items.map(addAccessUrl),
      };
    }

    // --------------------
    // POST /api/media
    // --------------------
    if (req.method === "POST") {
      const body = await req.json().catch(() => null);

      const title = body?.title;
      const mediaType = body?.mediaType; // "photo" | "video"
      const blobUrl = body?.blobUrl;

      if (!title || !mediaType || !blobUrl) {
        return {
          status: 400,
          jsonBody: { error: "Required fields: title, mediaType, blobUrl" },
        };
      }

      const now = new Date().toISOString();
      const item = {
        id: body?.id || crypto.randomUUID(),
        title,
        mediaType,
        blobUrl,

        caption: body?.caption || "",
        location: body?.location || "",
        people: Array.isArray(body?.people) ? body.people : [],

        createdAt: body?.createdAt || now,
        updatedAt: now,
      };

      await container.items.create(item);

      return {
        status: 201,
        jsonBody: addAccessUrl(item),
      };
    }

    return { status: 405, jsonBody: { error: "Method not allowed" } };
  },
});
