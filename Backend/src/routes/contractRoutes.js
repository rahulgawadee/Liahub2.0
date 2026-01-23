const express = require("express");
const auth = require("../middleware/auth");
const contractController = require("../controllers/contractController");
const multerContracts = require("../config/multerContracts");

const router = express.Router();

// Get all contracts for user's organization
router.get("/", auth, contractController.getContracts);

// Get pending contract (for first login check)
router.get("/pending", auth, contractController.getPendingContract);

// Get contract template (education manager/admin)
router.get("/template/active", auth, contractController.getContractTemplate);

// Create or update contract template (education manager/admin)
router.post("/template", auth, contractController.upsertContractTemplate);

// Get contract by ID
router.get("/:id", auth, contractController.getContractById);

// Create new contract (education manager/admin)
router.post("/", auth, contractController.createContract);

// Upload contract PDF
router.post("/upload-pdf", auth, multerContracts.single("contractPdf"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const fileUrl = `/uploads/contracts/${req.file.filename}`;
  res.json({ fileUrl, filename: req.file.filename });
});

// Update contract (before signing)
router.put("/:id", auth, contractController.updateContract);

// Download contract
router.get("/:id/download", auth, contractController.downloadContract);

// Sign contract (company)
router.post("/:id/sign", auth, contractController.signContract);

module.exports = router;
