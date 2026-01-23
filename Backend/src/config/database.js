const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/Liahub";

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, {
      autoIndex: false,
      serverSelectionTimeoutMS: 10000,
    });
    logger.info("MongoDB connected", { uri });
  } catch (error) {
    logger.error("MongoDB connection error", error);
    throw error;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = {
  connectDB,
  disconnectDB,
};
