// api/_shared/auth.js
// Shared authentication + user helpers for the COM769 Media App

const { CosmosClient } = require("@azure/cosmos");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Get required env var or throw
function mustGet(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

// Cosmos: Users container
function getUsersContainer() {
  const client = new CosmosClient(mustGet("COSMOS_CONNECTION_STRING"));
  const db = client.database(mustGet("COSMOS_DATABASE_NAME"));
  const container = db.container(mustGet("COSMOS_CONTAINER_USERS"));
  return container;
}

// Find user by username (stored lowercase)
async function findUserByUsername(username) {
  if (!username) return null;

  const container = getUsersContainer();
  const u = String(username).trim().toLowerCase();

  const querySpec = {
    query: "SELECT * FROM c WHERE c.username = @u",
    parameters: [{ name: "@u", value: u }],
  };

  const { resources } = await container.items.query(querySpec).fetchAll();
  return resources?.[0] || null;
}

// Find user by email (stored lowercase)
async function findUserByEmail(email) {
  if (!email) return null;

  const container = getUsersContainer();
  const e = String(email).trim().toLowerCase();

  const querySpec = {
    query: "SELECT * FROM c WHERE c.email = @e",
    parameters: [{ name: "@e", value: e }],
  };

  const { resources } = await container.items.query(querySpec).fetchAll();
  return resources?.[0] || null;
}

// Sign a JWT for a user { id, username, email }
function signUserToken(user) {
  const secret = mustGet("JWT_SECRET");

  const payload = {
    sub: user.id,
    username: user.username,
    email: user.email,
  };

  // 7-day expiry is fine for this coursework
  const token = jwt.sign(payload, secret, { expiresIn: "7d" });
  return token;
}

module.exports = {
  mustGet,
  getUsersContainer,
  findUserByUsername,
  findUserByEmail,
  signUserToken,
  bcrypt,
};
