const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");
const { v4: uuidv4 } = require("uuid");

function mustGet(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getCommentsContainer() {
  const client = new CosmosClient(mustGet("COSMOS_CONNECTION_STRING"));
  const db = client.database(mustGet("COSMOS_DATABASE_NAME"));
  return db.container(mustGet("COSMOS_CONTAINER_COMMENTS"));
}

app.http("comments", {
  route: "media/{id}/comments",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const container = getCommentsContainer();
      const mediaId = request.params.id;

      // -----------------------
      // POST /media/{id}/comments
      // -----------------------
      if (request.method === "POST") {
        const body = await request.json();

        const author = (body.author || "Anonymous").toString().trim();
        const text = (body.text || "").toString().trim();

        if (!text) {
          return { status: 400, jsonBody: { error: "BadRequest", message: "Required field: text" } };
        }

        const now = new Date().toISOString();
        const item = {
          id: uuidv4(),
          mediaId,          // IMPORTANT (partition key should be /mediaId)
          author,
          text,
          createdAt: now,
        };

        await container.items.create(item, { partitionKey: mediaId });

        return { status: 201, jsonBody: item };
      }

      // -----------------------
      // GET /media/{id}/comments
      // -----------------------
      const querySpec = {
        query: "SELECT * FROM c WHERE c.mediaId = @mediaId ORDER BY c.createdAt DESC",
        parameters: [{ name: "@mediaId", value: mediaId }],
      };

      // If partition key is /mediaId (recommended), pass it:
      const { resources } = await container.items
        .query(querySpec, { partitionKey: mediaId })
        .fetchAll();

      return { status: 200, jsonBody: resources || [] };
    } catch (err) {
      context.error(err);
      return { status: 500, jsonBody: { error: "Server error", message: err.message } };
    }
  },
});
