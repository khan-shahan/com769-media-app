const { app } = require("@azure/functions");
const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol, StorageSharedKeyCredential } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");

function mustGet(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

// Parse account name + key from a connection string
function parseStorageConnString(conn) {
  const parts = conn.split(";").filter(Boolean);
  const map = {};
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    map[k] = rest.join("=");
  }
  return {
    accountName: map.AccountName,
    accountKey: map.AccountKey,
    endpointSuffix: map.EndpointSuffix || "core.windows.net",
  };
}

app.http("uploadsSas", {
  route: "uploads/sas",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const body = await request.json();

      // Expect: fileName + contentType + mediaType
      const fileName = (body.fileName || "").trim();
      const contentType = (body.contentType || "").trim();
      const mediaType = (body.mediaType || "").trim(); // photo|video

      if (!fileName || !contentType || !mediaType) {
        return {
          status: 400,
          jsonBody: { error: "Required: fileName, contentType, mediaType" },
        };
      }

      if (!["photo", "video"].includes(mediaType)) {
        return {
          status: 400,
          jsonBody: { error: "mediaType must be 'photo' or 'video'" },
        };
      }

      // Choose container based on type (simple)
      const containerName = mediaType === "photo" ? "media" : "raw-uploads";

      const storageConn = mustGet("STORAGE_CONNECTION_STRING");
      const blobServiceClient = BlobServiceClient.fromConnectionString(storageConn);

      // Make sure container exists (safe in coursework)
      const containerClient = blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists();

      // Generate unique blob name
      const safeOriginal = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const blobName = `${mediaType}/${uuidv4()}-${safeOriginal}`;

      // Build blob URL (no SAS) for storing in Cosmos
      const blobClient = containerClient.getBlobClient(blobName);
      const blobUrl = blobClient.url;

      // Generate SAS for uploading (PUT)
      const { accountName, accountKey } = parseStorageConnString(storageConn);
      const credential = new StorageSharedKeyCredential(accountName, accountKey);

      const expiresOn = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const sas = generateBlobSASQueryParameters(
        {
          containerName,
          blobName,
          permissions: BlobSASPermissions.parse("cw"), // create + write
          expiresOn,
          protocol: SASProtocol.Https,
          contentType,
        },
        credential
      ).toString();

      const uploadUrl = `${blobUrl}?${sas}`;

      return {
        status: 200,
        jsonBody: {
          containerName,
          blobName,
          blobUrl,
          uploadUrl,
          expiresOn: expiresOn.toISOString(),
        },
      };
    } catch (err) {
      context.error(err);
      return {
        status: 500,
        jsonBody: { error: "Server error", message: err.message },
      };
    }
  },
});
