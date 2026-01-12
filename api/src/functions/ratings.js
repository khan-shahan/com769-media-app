const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");
const { v4: uuidv4 } = require("uuid");

function mustGet(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getRatingsContainer() {
  const client = new CosmosClient(mustGet("COSMOS_CONNECTION_STRING"));
  const db = client.database(mustGet("COSMOS_DATABASE_NAME"));
  return db.container(mustGet("COSMOS_CONTAINER_RATINGS"));
}

app.http("ratings", {
  route: "media/{id}/ratings",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const container = getRatingsContainer();
      const mediaId = request.params.id;

      // -----------------------
      // POST /media/{id}/ratings
      // body: { score: 1..5, author?: "Shahan" }
      // -----------------------
      if (request.method === "POST") {
        const body = await request.json();

        const author = (body.author || "Anonymous").toString().trim();
        const score = Number(body.score);

        if (!Number.isFinite(score) || score < 1 || score > 5) {
          return {
            status: 400,
            jsonBody: { error: "BadRequest", message: "score must be a number between 1 and 5" },
          };
        }

        const now = new Date().toISOString();
        const item = {
          id: uuidv4(),
          mediaId,          // IMPORTANT (partition key should be /mediaId)
          author,
          score,
          createdAt: now,
        };

        await container.items.create(item, { partitionKey: mediaId });

        return { status: 201, jsonBody: item };
      }

      // -----------------------
      // GET /media/{id}/ratings
      // returns list + average
      // -----------------------
      const querySpec = {
        query: "SELECT * FROM c WHERE c.mediaId = @mediaId",
        parameters: [{ name: "@mediaId", value: mediaId }],
      };

      const { resources } = await container.items
        .query(querySpec, { partitionKey: mediaId })
        .fetchAll();

      const list = resources || [];
      const count = list.length;
      const avg = count ? list.reduce((s, r) => s + (Number(r.score) || 0), 0) / count : 0;

      return {
        status: 200,
        jsonBody: { mediaId, count, average: Number(avg.toFixed(2)), ratings: list },
      };
    } catch (err) {
      context.error(err);
      return { status: 500, jsonBody: { error: "Server error", message: err.message } };
    }
  },
});
