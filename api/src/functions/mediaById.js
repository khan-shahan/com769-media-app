// api/src/functions/mediaById.js
const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");
const {
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

/* -------------------- helpers -------------------- */

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

// Query-based fetch (works without knowing partition key)
async function findById(container, id) {
  const querySpec = {
    query: "SELECT * FROM c WHERE c.id = @id",
    parameters: [{ name: "@id", value: id }],
  };
  const { resources } = await container.items.query(querySpec).fetchAll();
  return resources?.[0] || null;
}

// Robustly extract {id} even if bindingData is missing
function getRouteId(req, context) {
  const fromBinding = context?.bindingData?.id;
  if (fromBinding) return fromBinding;

  const fromParams = req?.params?.id;
  if (fromParams) return fromParams;

  try {
    const u = new URL(req.url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1];
  } catch {
    return null;
  }
}

// ---- SAS helpers (for accessUrl) ----
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

/* -------------------- function -------------------- */

app.http("mediaById", {
  methods: ["GET", "PATCH", "DELETE"],
  authLevel: "anonymous",
  route: "media/{id}",
  handler: async (req, context) => {
    try {
      const container = getMediaContainer();
      const id = getRouteId(req, context);
      if (!id) {
        return { status: 400, jsonBody: { error: "Missing route id" } };
      }

      // fetch once via query (independent of partition key)
      const item = await findById(container, id);
      if (!item || item.deleted === true) {
        // if it's already soft-deleted, treat as not found for PATCH/DELETE
        if (req.method === "GET") {
          return { status: 404, jsonBody: { error: "Not found" } };
        }
        if (req.method === "PATCH" || req.method === "DELETE") {
          return { status: 404, jsonBody: { error: "Not found" } };
        }
      }

      /* ---------- GET /api/media/{id} ---------- */
      if (req.method === "GET") {
        return { status: 200, jsonBody: addAccessUrl(item) };
      }

      /* ---------- PATCH /api/media/{id} ---------- */
      if (req.method === "PATCH") {
        const body = await req.json().catch(() => ({}));
        const now = new Date().toISOString();

        const updated = {
          ...item,
          title: body.title ?? item.title,
          caption: body.caption ?? item.caption,
          location: body.location ?? item.location,
          people: Array.isArray(body.people) ? body.people : item.people,
          updatedAt: now,
        };

        // 🔑 upsert: uses the existing partition key in the document
        await container.items.upsert(updated);

        return { status: 200, jsonBody: addAccessUrl(updated) };
      }

      /* ---------- DELETE /api/media/{id} ---------- */
      if (req.method === "DELETE") {
        const now = new Date().toISOString();

        // soft delete: mark as deleted, keep everything else
        const updated = {
          ...item,
          deleted: true,
          deletedAt: now,
        };

        // 🔑 again, upsert so we don't care what the partition key is
        await container.items.upsert(updated);

        return {
          status: 200,
          jsonBody: { ok: true, id, deleted: true, deletedAt: now },
        };
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
