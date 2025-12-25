const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");
const { BlobServiceClient } = require("@azure/storage-blob");

function mustGet(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getContainer() {
  const client = new CosmosClient(mustGet("COSMOS_CONNECTION_STRING"));
  const db = client.database(mustGet("COSMOS_DATABASE_NAME"));
  return db.container(mustGet("COSMOS_CONTAINER_MEDIA"));
}

// helper: fetch item by id (query, works without knowing partition key)
async function findById(container, id) {
  const querySpec = {
    query: "SELECT * FROM c WHERE c.id = @id",
    parameters: [{ name: "@id", value: id }],
  };
  const { resources } = await container.items.query(querySpec).fetchAll();
  return resources?.[0] || null;
}

// Parse Azure Blob URL -> { containerName, blobPath } or null
function parseAzureBlobUrl(blobUrl) {
  try {
    const u = new URL(blobUrl);

    // Only handle Azure Blob hostnames (basic check)
    if (!u.hostname.includes(".blob.core.windows.net")) return null;

    // pathname like: /<container>/<blobPath>
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const containerName = parts[0];
    const blobPath = parts.slice(1).join("/");

    return { containerName, blobPath };
  } catch {
    return null;
  }
}

async function deleteBlobIfAzureUrl(context, blobUrl) {
  if (!blobUrl) return;

  const parsed = parseAzureBlobUrl(blobUrl);
  if (!parsed) {
    // Not an Azure Blob URL (or not parseable) -> skip cleanup
    context.log(`Blob cleanup skipped (non-Azure or invalid blobUrl): ${blobUrl}`);
    return;
  }

  const { containerName, blobPath } = parsed;

  const storageConn = mustGet("STORAGE_CONNECTION_STRING");
  const blobServiceClient = BlobServiceClient.fromConnectionString(storageConn);

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobPath);

  // Best practice: delete blob + any snapshots (if any exist)
  const result = await blobClient.deleteIfExists({ deleteSnapshots: "include" });

  context.log(
    `Blob deleteIfExists: deleted=${result.succeeded} container=${containerName} blob=${blobPath}`
  );
}

app.http("mediaById", {
  route: "media/{id}",
  methods: ["PATCH", "DELETE"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const container = getContainer();
      const id = request.params.id;

      // 1) Load existing item (so we know partition key value = mediaType)
      const existing = await findById(container, id);
      if (!existing) {
        return { status: 404, jsonBody: { error: "NotFound", message: "Media item not found" } };
      }

      const pk = existing.mediaType; // because partition key path is /mediaType

      // -----------------------
      // PATCH: partial update
      // -----------------------
      if (request.method === "PATCH") {
        const body = await request.json();

        const next = { ...existing };

        if (typeof body.title === "string") next.title = body.title.trim();
        if (typeof body.blobUrl === "string") next.blobUrl = body.blobUrl.trim();

        if (body.mediaType && body.mediaType !== existing.mediaType) {
          return {
            status: 400,
            jsonBody: {
              error: "BadRequest",
              message: "mediaType cannot be changed (partition key). Create a new item instead.",
            },
          };
        }

        next.updatedAt = new Date().toISOString();

        const { resource } = await container.item(id, pk).replace(next);
        return { status: 200, jsonBody: resource };
      }

      // -----------------------
      // DELETE: remove blob + record
      // -----------------------
      if (request.method === "DELETE") {
        // 1) Try blob cleanup (only if blobUrl is Azure Blob URL)
        await deleteBlobIfAzureUrl(context, existing.blobUrl);

        // 2) Delete Cosmos record
        await container.item(id, pk).delete();

        return { status: 204 };
      }

      return { status: 405, jsonBody: { error: "MethodNotAllowed" } };
    } catch (err) {
      context.error(err);
      return { status: 500, jsonBody: { error: "Server error", message: err.message } };
    }
  },
});
