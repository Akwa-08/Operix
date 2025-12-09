// const path = require('path');
// const express = require("express");
// const cors = require('cors');
// const pool = require("./db");
// const app = express();

// // Optional: keep cors only if you also fetch from other origins
// app.use(cors());

// // JSON parsing
// app.use(express.json());

// // API route
// app.get("/api/inventory", async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT 
//         ii.id,
//         it.name AS item_type,
//         ii.item_variant,
//         ii.stock,
//         su.name AS stock_unit,
//         sp.name AS supplier,
//         ii.status
//       FROM inventory_items ii
//       LEFT JOIN item_types it ON it.id = ii.item_type_id
//       LEFT JOIN stock_units su ON su.id = ii.stock_unit_id
//       LEFT JOIN suppliers sp ON sp.id = ii.supplier_id
//     `);
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Database error");
//   }
// });

// // All other routes -> serve index.html (use '/*' not '*')
// app.get(/^\/(?!api\/).*/, (req, res) => {
//   res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


const path = require("path");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const pool = require("./db"); // Your PostgreSQL connection

const app = express();

// Middleware
app.use(cors()); // optional if frontend served from same origin
app.use(express.json());

// --------------------
// API routes
// --------------------

// Get dashboard statistics
app.get("/api/dashboard", async (req, res) => {
  try {
    const totalItems = await pool.query(`
      SELECT COUNT(*) as count FROM inventory_items WHERE status != 'Phased Out'
    `);
    
    const lowStock = await pool.query(`
      SELECT COUNT(*) as count FROM inventory_items 
      WHERE stock < 10 AND status != 'Phased Out'
    `);
    
    const totalStock = await pool.query(`
      SELECT COALESCE(SUM(stock), 0) as total FROM inventory_items 
      WHERE status != 'Phased Out'
    `);
    
    const phasedOut = await pool.query(`
      SELECT COUNT(*) as count FROM inventory_items WHERE status = 'Phased Out'
    `);

    res.json({
      totalItems: parseInt(totalItems.rows[0].count),
      lowStock: parseInt(lowStock.rows[0].count),
      totalStock: parseInt(totalStock.rows[0].total),
      phasedOut: parseInt(phasedOut.rows[0].count)
    });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// Get all inventory items
app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ii.id,
        it.name AS item_type,
        it.id AS item_type_id,
        ii.item_variant,
        ii.stock,
        su.name AS stock_unit,
        su.id AS stock_unit_id,
        sp.name AS supplier,
        sp.id AS supplier_id,
        ii.status
      FROM inventory_items ii
      LEFT JOIN item_types it ON it.id = ii.item_type_id
      LEFT JOIN stock_units su ON su.id = ii.stock_unit_id
      LEFT JOIN suppliers sp ON sp.id = ii.supplier_id
      ORDER BY ii.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// Get single item by ID (for info modal)
app.get("/api/inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        ii.id,
        it.name AS item_type,
        it.id AS item_type_id,
        ii.item_variant,
        ii.stock,
        su.name AS stock_unit,
        su.id AS stock_unit_id,
        sp.name AS supplier,
        sp.id AS supplier_id,
        ii.status
      FROM inventory_items ii
      LEFT JOIN item_types it ON it.id = ii.item_type_id
      LEFT JOIN stock_units su ON su.id = ii.stock_unit_id
      LEFT JOIN suppliers sp ON sp.id = ii.supplier_id
      WHERE ii.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// Add new item
app.post("/api/inventory", async (req, res) => {
  try {
    const { item_type_id, item_variant, stock, stock_unit_id, supplier_id, status } = req.body;
    
    if (!item_type_id || !item_variant || stock === undefined || !stock_unit_id || !supplier_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await pool.query(`
      INSERT INTO inventory_items (item_type_id, item_variant, stock, stock_unit_id, supplier_id, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [item_type_id, item_variant, stock, stock_unit_id, supplier_id, status || 'Available']);
    
    // Get the full item with joins
    const fullItem = await pool.query(`
      SELECT 
        ii.id,
        it.name AS item_type,
        it.id AS item_type_id,
        ii.item_variant,
        ii.stock,
        su.name AS stock_unit,
        su.id AS stock_unit_id,
        sp.name AS supplier,
        sp.id AS supplier_id,
        ii.status
      FROM inventory_items ii
      LEFT JOIN item_types it ON it.id = ii.item_type_id
      LEFT JOIN stock_units su ON su.id = ii.stock_unit_id
      LEFT JOIN suppliers sp ON sp.id = ii.supplier_id
      WHERE ii.id = $1
    `, [result.rows[0].id]);
    
    res.status(201).json(fullItem.rows[0]);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// Reduce stock of item
app.put("/api/inventory/:id/reduce-stock", async (req, res) => {
  try {
    const { id } = req.params;
    const { reduceAmount } = req.body;
    
    if (!reduceAmount || reduceAmount <= 0) {
      return res.status(400).json({ error: "Invalid reduce amount" });
    }
    
    // Get current stock
    const currentItem = await pool.query(`
      SELECT stock FROM inventory_items WHERE id = $1
    `, [id]);
    
    if (currentItem.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    const currentStock = currentItem.rows[0].stock;
    const newStock = Math.max(0, currentStock - reduceAmount);
    
    // Update stock
    await pool.query(`
      UPDATE inventory_items 
      SET stock = $1 
      WHERE id = $2
    `, [newStock, id]);
    
    // Get the full updated item
    const fullItem = await pool.query(`
      SELECT 
        ii.id,
        it.name AS item_type,
        it.id AS item_type_id,
        ii.item_variant,
        ii.stock,
        su.name AS stock_unit,
        su.id AS stock_unit_id,
        sp.name AS supplier,
        sp.id AS supplier_id,
        ii.status
      FROM inventory_items ii
      LEFT JOIN item_types it ON it.id = ii.item_type_id
      LEFT JOIN stock_units su ON su.id = ii.stock_unit_id
      LEFT JOIN suppliers sp ON sp.id = ii.supplier_id
      WHERE ii.id = $1
    `, [id]);
    
    res.json(fullItem.rows[0]);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// Update item (for edit modal)
app.put("/api/inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { item_type_id, item_variant, stock, stock_unit_id, supplier_id, status } = req.body;
    
    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (item_type_id !== undefined) {
      updates.push(`item_type_id = $${paramCount++}`);
      values.push(item_type_id);
    }
    if (item_variant !== undefined) {
      updates.push(`item_variant = $${paramCount++}`);
      values.push(item_variant);
    }
    if (stock !== undefined) {
      updates.push(`stock = $${paramCount++}`);
      values.push(stock);
    }
    if (stock_unit_id !== undefined) {
      updates.push(`stock_unit_id = $${paramCount++}`);
      values.push(stock_unit_id);
    }
    if (supplier_id !== undefined) {
      updates.push(`supplier_id = $${paramCount++}`);
      values.push(supplier_id);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    values.push(id);
    const updateQuery = `
      UPDATE inventory_items 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
    `;
    
    await pool.query(updateQuery, values);
    
    // Get the full updated item
    const fullItem = await pool.query(`
      SELECT 
        ii.id,
        it.name AS item_type,
        it.id AS item_type_id,
        ii.item_variant,
        ii.stock,
        su.name AS stock_unit,
        su.id AS stock_unit_id,
        sp.name AS supplier,
        sp.id AS supplier_id,
        ii.status
      FROM inventory_items ii
      LEFT JOIN item_types it ON it.id = ii.item_type_id
      LEFT JOIN stock_units su ON su.id = ii.stock_unit_id
      LEFT JOIN suppliers sp ON sp.id = ii.supplier_id
      WHERE ii.id = $1
    `, [id]);
    
    if (fullItem.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    res.json(fullItem.rows[0]);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// Flag item as Phased Out
app.put("/api/inventory/:id/phase-out", async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(`
      UPDATE inventory_items 
      SET status = 'Phased Out'
      WHERE id = $1
    `, [id]);
    
    // Get the full updated item
    const fullItem = await pool.query(`
      SELECT 
        ii.id,
        it.name AS item_type,
        it.id AS item_type_id,
        ii.item_variant,
        ii.stock,
        su.name AS stock_unit,
        su.id AS stock_unit_id,
        sp.name AS supplier,
        sp.id AS supplier_id,
        ii.status
      FROM inventory_items ii
      LEFT JOIN item_types it ON it.id = ii.item_type_id
      LEFT JOIN stock_units su ON su.id = ii.stock_unit_id
      LEFT JOIN suppliers sp ON sp.id = ii.supplier_id
      WHERE ii.id = $1
    `, [id]);
    
    if (fullItem.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    res.json(fullItem.rows[0]);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// Get item types (for dropdowns in modals)
app.get("/api/item-types", async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, name FROM item_types ORDER BY name`);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// Get stock units (for dropdowns in modals)
app.get("/api/stock-units", async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, name FROM stock_units ORDER BY name`);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// Get suppliers (for dropdowns in modals)
app.get("/api/suppliers", async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, name FROM suppliers ORDER BY name`);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// --------------------
// Database View Endpoints (to see all database data)
// --------------------

// View all inventory items (raw database view)
app.get("/api/db/inventory-items", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM inventory_items ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// View all item types
app.get("/api/db/item-types", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM item_types ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// View all stock units
app.get("/api/db/stock-units", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM stock_units ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// View all suppliers
app.get("/api/db/suppliers", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM suppliers ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// View all database tables summary
app.get("/api/db/all", async (req, res) => {
  try {
    const inventoryItems = await pool.query(`SELECT * FROM inventory_items ORDER BY id`);
    const itemTypes = await pool.query(`SELECT * FROM item_types ORDER BY id`);
    const stockUnits = await pool.query(`SELECT * FROM stock_units ORDER BY id`);
    const suppliers = await pool.query(`SELECT * FROM suppliers ORDER BY id`);
    
    res.json({
      inventory_items: inventoryItems.rows,
      item_types: itemTypes.rows,
      stock_units: stockUnits.rows,
      suppliers: suppliers.rows
    });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Database error", 
      message: err.message,
      details: process.env.DATABASE_URL ? "Database URL is set" : "DATABASE_URL not found in .env file"
    });
  }
});

// --------------------
// Serve React build (only if build directory exists)
// --------------------
const buildPath = path.join(__dirname, "frontend", "build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  
  // All non-API routes -> React index.html
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  // If build doesn't exist, just return a message for non-API routes
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.status(404).json({ message: "Frontend build not found. Please build the React app first." });
  });
}

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

