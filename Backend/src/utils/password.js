const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const generateRandomPassword = (length = 12) =>
  crypto.randomBytes(length).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, length);

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = {
  generateRandomPassword,
  hashPassword,
};
