const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const init = require("./db/init");
const { getSession } = require("./utils/session");
const client = require("./db/client");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const apiRoutes = require("./routes/api");

const app = express();
const PUBLIC_DIR = path.join(__dirname, "public");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

async function currentUser(req) {
  const session = await getSession(req.cookies.orbit_session);
  if (!session) return null;

  const result = await client.execute({
    sql: "SELECT id, is_admin FROM orbit_users WHERE id = ?",
    args: [session.user_id]
  });

  return result.rows[0] || null;
}

async function guardDashboard(req, res, next) {
  const user = await currentUser(req);
  if (!user) return res.redirect("/register");
  next();
}

async function guardAdmin(req, res, next) {
  const user = await currentUser(req);
  if (!user) return res.redirect("/register");
  if (Number(user.is_admin) !== 1) return res.redirect("/dashboard");
  next();
}

app.get("/dashboard", guardDashboard, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "dashboard.html"));
});

app.get("/perfil", guardDashboard, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "perfil.html"));
});

app.get("/admin", guardAdmin, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/v1", apiRoutes);

app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, "404.html"));
});

const PORT = process.env.PORT || 3000;

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Orbit API corriendo en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error iniciando la base de datos:", err);
    process.exit(1);
  });
