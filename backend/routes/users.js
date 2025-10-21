const express = require("express");
const multer = require("multer");
const path = require("path");
const pool = require("../config/db");
const authenticateToken = require("../middleware/auth");
const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const valid =
      allowed.test(file.mimetype) &&
      allowed.test(path.extname(file.originalname).toLowerCase());
    valid ? cb(null, true) : cb(new Error("Only image files are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, full_name, email, phone, discount_type, discount_photo FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Get user info error:", error);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

// Upload discount photo
router.post(
  "/upload-discount-photo",
  authenticateToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      await pool.query("UPDATE users SET discount_photo = ? WHERE id = ?", [
        req.file.filename,
        req.user.id,
      ]);

      res.json({
        success: true,
        message: "Photo uploaded successfully",
        filename: req.file.filename,
        filePath: `/uploads/${req.file.filename}`,
      });
    } catch (error) {
      console.error("Upload photo error:", error);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  }
);

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { full_name, phone, discount_type } = req.body;

    await pool.query(
      "UPDATE users SET full_name = ?, phone = ?, discount_type = ? WHERE id = ?",
      [full_name, phone, discount_type, req.user.id]
    );

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get user discount info
router.get("/discount-info", authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT discount_type, discount_photo FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json(users[0]);
  } catch (error) {
    console.error("Get discount info error:", error);
    res.status(500).json({ error: "Failed to fetch discount info" });
  }
});

module.exports = router;
