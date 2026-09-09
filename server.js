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

// Necesario para que req.headers['x-forwarded-for'] traiga la IP real
// del visitante y no la del proxy de Render.
app.set("trust proxy", true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

async function currentUser(req) {
  const session = await getSession(req.cookies.orbit_session);
  if (!session) return null;

  const result = await client.execute({
    sql: "SELECT id, is_admin, vip, vip_expires_at FROM orbit_users WHERE id = ?",
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

async function guardVip(req, res, next) {
  const user = await currentUser(req);
  if (!user) return res.redirect("/register");
  const isVip = Number(user.is_admin) === 1 || (Number(user.vip) === 1 && (!user.vip_expires_at || new Date(user.vip_expires_at).getTime() > Date.now()));
  if (!isVip) return res.redirect("/dashboard");
  next();
}

app.get("/dashboard", guardDashboard, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "dashboard.html"));
});

app.get("/search", guardDashboard, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "search", "index.html"));
});

app.get("/download", guardDashboard, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "download", "index.html"));
});

app.get("/ia", guardDashboard, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "ia", "index.html"));
});

app.get("/tools", guardDashboard, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "tools", "index.html"));
});

app.get("/anime", guardDashboard, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "anime", "index.html"));
});

app.get("/endpoints", guardDashboard, (req, res) => {
  res.redirect("/download");
});

app.get("/perfil", guardDashboard, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "perfil.html"));
});

app.get("/vip", guardDashboard, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "vip.html"));
});

app.get("/admin", guardAdmin, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.get("/ip-config", guardDashboard, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "ip-config.html"));
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