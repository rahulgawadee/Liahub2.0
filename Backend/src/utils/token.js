const jwt = require("jsonwebtoken");

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "30d";

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = {
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
