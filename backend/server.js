const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Enable CORS (for frontend communication)
app.use(cors());

// Parse incoming JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// ✅ MySQL Connection Pool
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root", // Set your MySQL password if applicable
  database: "drone_agri_system",
});

// ✅ Test Database Connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ Connected to MySQL database: drone_agri_system");
    connection.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
})();

// -------------------------------------------------------------
// 🚀 ROUTES
// -------------------------------------------------------------

// ✅ Route: Create a new schedule
app.post("/api/schedule", async (req, res) => {
  const { farmer_name, crop_type, mission_datetime, drone_id, waypoints } = req.body;

  // Validation
  if (!farmer_name || !crop_type || !mission_datetime || !drone_id || !waypoints) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    await db.query(
      "INSERT INTO schedules (farmer_name, crop_type, mission_datetime, drone_id, waypoints) VALUES (?, ?, ?, ?, ?)",
      [farmer_name, crop_type, mission_datetime, drone_id, JSON.stringify(waypoints)]
    );

    console.log("✅ Schedule added successfully");
    res.json({ success: true, message: "Mission scheduled successfully!" });
  } catch (err) {
    console.error("❌ Error inserting schedule:", err);
    res.status(500).json({ success: false, message: "Failed to save mission schedule." });
  }
});

// ✅ Route: Get all reports
app.get("/api/reports", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM reports ORDER BY mission_date DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    res.status(500).json({ message: "Failed to fetch reports." });
  }
});

// ✅ Route: Download report by ID
app.get("/api/reports/download/:id", async (req, res) => {
  const reportId = req.params.id;

  try {
    const [rows] = await db.query("SELECT report_file FROM reports WHERE report_id = ?", [reportId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Report not found." });
    }

    const reportFile = rows[0].report_file;
    const reportPath = path.join(__dirname, "reports", reportFile);

    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ message: "Report file does not exist." });
    }

    console.log(`📄 Downloading report: ${reportFile}`);
    res.download(reportPath);
  } catch (err) {
    console.error("❌ Error downloading report:", err);
    res.status(500).json({ message: "Error downloading report." });
  }
});

// ✅ Route: Default homepage (optional)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------------------------------------------------
// 🚀 START SERVER
// -------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
