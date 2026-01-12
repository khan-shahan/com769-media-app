// api/src/functions/authCheckUsername.js
const { app } = require("@azure/functions");
const { findUserByUsername } = require("../../_shared/auth");

app.http("authCheckUsername", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/check-username",
  handler: async (request, context) => {
    try {
      const body = await request.json().catch(() => ({}));
      const raw = body.username || "";
      const username = String(raw).trim().toLowerCase();

      if (!username || username.length < 3) {
        return {
          status: 400,
          jsonBody: { ok: false, reason: "Username too short (min 3 chars)" },
        };
      }

      const existing = await findUserByUsername(username);
      const available = !existing;

      return {
        status: 200,
        jsonBody: { ok: true, available },
      };
    } catch (err) {
      context.error("authCheckUsername failed", err);
      return {
        status: 500,
        jsonBody: { ok: false, error: "Internal server error" },
      };
    }
  },
});
