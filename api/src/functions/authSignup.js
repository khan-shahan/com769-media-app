// api/src/functions/authSignup.js
const { app } = require("@azure/functions");
const {
  getUsersContainer,
  findUserByUsername,
  findUserByEmail,
  signUserToken,
  bcrypt,
} = require("../../_shared/auth");
const { v4: uuidv4 } = require("uuid");

app.http("authSignup", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/signup",
  handler: async (request, context) => {
    try {
      const body = await request.json().catch(() => ({}));

      const usernameRaw = body.username || "";
      const emailRaw = body.email || "";
      const passwordRaw = body.password || "";

      const username = String(usernameRaw).trim().toLowerCase();
      const email = String(emailRaw).trim().toLowerCase();
      const password = String(passwordRaw);

      // Basic validation
      if (!username || username.length < 3) {
        return {
          status: 400,
          jsonBody: { error: "Username must be at least 3 characters." },
        };
      }

      if (!email || !email.includes("@")) {
        return {
          status: 400,
          jsonBody: { error: "Invalid email address." },
        };
      }

      if (!password || password.length < 6) {
        return {
          status: 400,
          jsonBody: { error: "Password must be at least 6 characters." },
        };
      }

      // Check existing username
      const existingUsername = await findUserByUsername(username);
      if (existingUsername) {
        return {
          status: 409,
          jsonBody: { error: "Username is already taken." },
        };
      }

      // Check existing email
      const existingEmail = await findUserByEmail(email);
      if (existingEmail) {
        return {
          status: 409,
          jsonBody: { error: "Email is already registered." },
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      const user = {
        id: uuidv4(),
        username,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      const container = getUsersContainer();
      await container.items.create(user);

      const token = signUserToken(user);

      return {
        status: 201,
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
      context.error("authSignup failed", err);
      return {
        status: 500,
        jsonBody: { error: "Internal server error" },
      };
    }
  },
});
