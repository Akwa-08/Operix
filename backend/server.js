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
const pool = require("./db"); // Your PostgreSQL connection

const app = express();

// Middleware
app.use(cors()); // optional if frontend served from same origin
app.use(express.json());

// --------------------
// API route
// --------------------
app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ii.id,
        it.name AS item_type,
        ii.item_variant,
        ii.stock,
        su.name AS stock_unit,
        sp.name AS supplier,
        ii.status
      FROM inventory_items ii
      LEFT JOIN item_types it ON it.id = ii.item_type_id
      LEFT JOIN stock_units su ON su.id = ii.stock_unit_id
      LEFT JOIN suppliers sp ON sp.id = ii.supplier_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// --------------------
// Serve React build
// --------------------
const buildPath = path.join(__dirname, "frontend", "build");
app.use(express.static(buildPath));

// All non-API routes -> React index.html
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
