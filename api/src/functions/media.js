const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { v4: uuidv4 } = require('uuid');

function mustGet(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getContainer() {
  const client = new CosmosClient(mustGet('COSMOS_CONNECTION_STRING'));
  const db = client.database(mustGet('COSMOS_DATABASE_NAME'));
  return db.container(mustGet('COSMOS_CONTAINER_MEDIA'));
}

app.http('media', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const container = getContainer();

      // ---------------------------
      // GET /api/media  (list)
      // GET /api/media?id=<id> (single item)
      // ---------------------------
      if (request.method === 'GET') {
        const id = request.query.get('id');

        // Get single item by id
        if (id) {
          // Partition key is /mediaType, so we cannot read by id unless we also know mediaType.
          // We'll query by id instead (works without knowing partition key).
          const querySpec = {
            query: 'SELECT * FROM c WHERE c.id = @id',
            parameters: [{ name: '@id', value: id }]
          };

          const { resources } = await container.items.query(querySpec).fetchAll();

          if (!resources || resources.length === 0) {
            return { status: 404, jsonBody: { error: 'Not found' } };
          }

          return { status: 200, jsonBody: resources[0] };
        }

        // List all (newest first)
        const querySpec = { query: 'SELECT * FROM c ORDER BY c.createdAt DESC' };
        const { resources } = await container.items.query(querySpec).fetchAll();

        return { status: 200, jsonBody: resources };
      }

      // ---------------------------
      // POST /api/media (create)
      // ---------------------------
      const body = await request.json();

      const title = (body.title || '').trim();
      const mediaType = (body.mediaType || '').trim(); // "photo" | "video"
      const blobUrl = (body.blobUrl || '').trim();

      if (!title || !mediaType || !blobUrl) {
        return {
          status: 400,
          jsonBody: { error: 'Required fields: title, mediaType, blobUrl' }
        };
      }

      if (!['photo', 'video'].includes(mediaType)) {
        return {
          status: 400,
          jsonBody: { error: "mediaType must be 'photo' or 'video'" }
        };
      }

      const now = new Date().toISOString();
      const item = {
        id: uuidv4(),
        title,
        mediaType, // IMPORTANT because your partition key is /mediaType
        blobUrl,
        createdAt: now,
        updatedAt: now
      };

      await container.items.create(item);

      return { status: 201, jsonBody: item };
    } catch (err) {
      context.error(err);
      return {
        status: 500,
        jsonBody: { error: 'Server error', message: err.message }
      };
    }
  }
});
