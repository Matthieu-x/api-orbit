const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const { initDb } = require("./db/init");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const apiRoutes = require("./routes/api");
const { requireAuth, requireAdmin } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/user", requireAuth, userRoutes);
app.use("/api/admin", requireAuth, requireAdmin, adminRoutes);
app.use("/api/v1", apiRoutes);

// Protected pages
app.get("/dashboard", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});
app.get("/perfil", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "perfil.html"));
});
app.get("/admin", requireAuth, requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Public pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Orbit API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init DB:", err);
    process.exit(1);
  });
