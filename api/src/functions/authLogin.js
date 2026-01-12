// api/src/functions/authLogin.js
const { app } = require("@azure/functions");
const {
  findUserByEmail,
  signUserToken,
  bcrypt,
} = require("../../_shared/auth");

app.http("authLogin", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/login",
  handler: async (request, context) => {
    try {
      const body = await request.json().catch(() => ({}));

      const emailRaw = body.email || "";
      const passwordRaw = body.password || "";

      const email = String(emailRaw).trim().toLowerCase();
      const password = String(passwordRaw);

      if (!email || !password) {
        return {
          status: 400,
          jsonBody: { error: "Email and password are required." },
        };
      }

      const user = await findUserByEmail(email);
      if (!user) {
        return {
          status: 401,
          jsonBody: { error: "Invalid email or password." },
        };
      }

      const ok = await bcrypt.compare(password, user.passwordHash || "");
      if (!ok) {
        return {
          status: 401,
          jsonBody: { error: "Invalid email or password." },
        };
      }

      const token = signUserToken(user);

      return {
        status: 200,
        jsonBody: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        },
      };
    } catch (err) {
      context.error("authLogin failed", err);
      return {
        status: 500,
        jsonBody: { error: "Internal server error" },
      };
    }
  },
});
