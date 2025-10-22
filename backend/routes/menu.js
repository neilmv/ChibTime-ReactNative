const express = require("express");
const pool = require("../config/db");
const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT 
        m.id,
        m.name,
        m.description,
        m.price,
        m.image_url,
        m.is_available,
        c.name AS category_name,
        c.description AS category_description
      FROM menu_items m 
      LEFT JOIN categories c ON m.category_id = c.id 
      WHERE m.is_available = TRUE
      ORDER BY c.name, m.name
    `);

    const formatted = items.map((item) => ({
      ...item,
      price: item.price ? parseFloat(item.price) : 0,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Menu error:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});


// Get menu items by category
router.get("/category/:categoryId", async (req, res) => {
  try {
    const [items] = await pool.query(
      "SELECT * FROM menu_items WHERE category_id = ? AND is_available = TRUE ORDER BY name",
      [req.params.categoryId]
    );
    res.json(items);
  } catch (error) {
    console.error("Menu by category error:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

// Get all categories
router.get("/categories", async (req, res) => {
  try {
    const [categories] = await pool.query(
      "SELECT * FROM categories ORDER BY name"
    );
    res.json(categories);
  } catch (error) {
    console.error("Categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Get single menu item
router.get("/:id", async (req, res) => {
  try {
    const [items] = await pool.query(
      `
      SELECT m.*, c.name AS category_name 
      FROM menu_items m 
      LEFT JOIN categories c ON m.category_id = c.id 
      WHERE m.id = ?
    `,
      [req.params.id]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(items[0]);
  } catch (error) {
    console.error("Menu item error:", error);
    res.status(500).json({ error: "Failed to fetch menu item" });
  }
});

module.exports = router;
