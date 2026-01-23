const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const connectionRoutes = require("./connectionRoutes");
const contractRoutes = require("./contractRoutes");
const jobRoutes = require("./jobRoutes");
const liaRoutes = require("./liaRoutes");
const messageRoutes = require("./messageRoutes");
const documentRoutes = require("./documentRoutes");
const postRoutes = require("./postRoutes");
const notificationRoutes = require("./notificationRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const uploadRoutes = require("./uploadRoutes");
const organizationRoutes = require("./organizationRoutes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/connections", connectionRoutes);
router.use("/contracts", contractRoutes);
router.use("/jobs", jobRoutes);
router.use("/lias", liaRoutes);
router.use("/messages", messageRoutes);
router.use("/documents", documentRoutes);
router.use("/posts", postRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/upload", uploadRoutes);
router.use("/organizations", organizationRoutes);

module.exports = router;
