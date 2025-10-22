const express = require("express");
const pool = require("../config/db");
const authenticateToken = require("../middleware/auth.js");
const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [orders] = await connection.query(
      `
      SELECT 
        id,
        user_id,
        total_amount AS totalAmount,
        discount_amount AS discountAmount,
        final_amount AS finalAmount,
        payment_method,
        created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    const ordersWithItems = [];

    for (const order of orders) {
      const [items] = await connection.query(
        `SELECT 
           oi.id, 
           oi.menu_item_id, 
           oi.quantity, 
           oi.price, 
           mi.name 
         FROM order_items oi 
         JOIN menu_items mi ON oi.menu_item_id = mi.id 
         WHERE oi.order_id = ?`,
        [order.id]
      );
      ordersWithItems.push({ ...order, items });
    }

    res.json(ordersWithItems);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  } finally {
    if (connection) connection.release();
  }
});

// Create order
router.post("/", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { items, payment_method, discount_type } = req.body;

    if (!items || !payment_method) {
      return res
        .status(400)
        .json({ error: "Items and payment method are required" });
    }

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      const [menuItems] = await connection.query(
        "SELECT price FROM menu_items WHERE id = ? AND is_available = TRUE",
        [item.menu_item_id]
      );

      if (menuItems.length === 0) {
        connection.release();
        return res
          .status(400)
          .json({ error: `Menu item ID ${item.menu_item_id} not found` });
      }

      totalAmount += menuItems[0].price * item.quantity;
    }

    let discountAmount = 0;

    if (discount_type && discount_type.toLowerCase() === "save20") {
      discountAmount = totalAmount * 0.2;
    } else if (discount_type && discount_type.toLowerCase() === "loyalty") {
      discountAmount = 50;
    }

    const finalAmount = totalAmount - discountAmount;
    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, total_amount, discount_amount, final_amount, payment_method) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, totalAmount, discountAmount, finalAmount, payment_method]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      const [menuItems] = await connection.query(
        "SELECT price FROM menu_items WHERE id = ?",
        [item.menu_item_id]
      );

      await connection.query(
        "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.menu_item_id, item.quantity, menuItems[0].price]
      );
    }

    if (discount_type && discount_type !== "none") {
      await connection.query(
        "UPDATE users SET discount_type = ? WHERE id = ?",
        [discount_type, req.user.id]
      );
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: { id: orderId, totalAmount, discountAmount, finalAmount },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create order" });
  } finally {
    if (connection) connection.release();
  }
});

// Other order routes use pool.query() similarly
// ...

module.exports = router;
