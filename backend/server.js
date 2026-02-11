import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data.sqlite");
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "no-reply@artesyoficios.mx";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

const ensureColumn = (table, column, type) => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.find((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
};

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workshops (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  seats INTEGER NOT NULL,
  category_id TEXT,
  images TEXT NOT NULL,
  map_embed TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT "10:00",
  location TEXT NOT NULL DEFAULT "",
  seats INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id)
);

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL,
  session_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  seats INTEGER NOT NULL,
  reservation_date TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

ensureColumn("reservations", "session_id", "TEXT");
ensureColumn("sessions", "time", "TEXT DEFAULT '10:00'");
ensureColumn("sessions", "location", "TEXT");


const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${nanoid()}${ext}`);
  }
});
const upload = multer({ storage });

const now = () => new Date().toISOString();

const listCategories = db.prepare("SELECT * FROM categories ORDER BY created_at DESC");
const insertCategory = db.prepare("INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)");
const deleteCategory = db.prepare("DELETE FROM categories WHERE id = ?");

const listBrands = db.prepare("SELECT * FROM brands ORDER BY created_at DESC");
const insertBrand = db.prepare("INSERT INTO brands (id, name, logo_url, created_at) VALUES (?, ?, ?, ?)");
const updateBrand = db.prepare("UPDATE brands SET name = ?, logo_url = ? WHERE id = ?");
const deleteBrand = db.prepare("DELETE FROM brands WHERE id = ?");

const listSessionsByWorkshop = db.prepare("SELECT * FROM sessions WHERE workshop_id = ? ORDER BY date ASC");
const insertSession = db.prepare("INSERT INTO sessions (id, workshop_id, date, time, location, seats, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
const deleteSession = db.prepare("DELETE FROM sessions WHERE id = ?");
const getSession = db.prepare("SELECT * FROM sessions WHERE id = ?");

const listWorkshops = db.prepare(`
  SELECT w.*, c.name as category_name
  FROM workshops w
  LEFT JOIN categories c ON w.category_id = c.id
  ORDER BY w.date ASC
`);
const getWorkshop = db.prepare("SELECT * FROM workshops WHERE id = ?");
const insertWorkshop = db.prepare(`
  INSERT INTO workshops (id, title, description, price, date, location, seats, category_id, images, map_embed, featured, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateWorkshop = db.prepare(`
  UPDATE workshops
  SET title = ?, description = ?, price = ?, date = ?, location = ?, seats = ?, category_id = ?, images = ?, map_embed = ?, featured = ?, updated_at = ?
  WHERE id = ?
`);
const deleteWorkshop = db.prepare("DELETE FROM workshops WHERE id = ?");

const listReservations = db.prepare(`
  SELECT r.*, w.title AS workshop_title, s.date AS session_date
  FROM reservations r
  LEFT JOIN workshops w ON r.workshop_id = w.id
  LEFT JOIN sessions s ON r.session_id = s.id
  ORDER BY r.created_at DESC
`);
const insertReservation = db.prepare(`
  INSERT INTO reservations (id, workshop_id, session_id, name, email, seats, reservation_date, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateReservationStatus = db.prepare(`
  UPDATE reservations SET status = ? WHERE id = ?
`);

const getSetting = db.prepare("SELECT value FROM settings WHERE key = ?");
const upsertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/categories", (req, res) => {
  res.json(listCategories.all());
});

app.post("/api/categories", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Nombre requerido" });
  const id = nanoid();
  insertCategory.run(id, name, now());
  res.json({ id, name });
});

app.delete("/api/categories/:id", (req, res) => {
  deleteCategory.run(req.params.id);
  res.json({ ok: true });
});

app.get("/api/brands", (req, res) => {
  res.json(listBrands.all());
});

app.post("/api/brands", (req, res) => {
  const { name, logo_url } = req.body;
  if (!name || !logo_url) return res.status(400).json({ error: "Nombre y logo requeridos" });
  const id = nanoid();
  insertBrand.run(id, name, logo_url, now());
  res.json({ id, name, logo_url });
});

app.put("/api/brands/:id", (req, res) => {
  const { name, logo_url } = req.body;
  updateBrand.run(name, logo_url, req.params.id);
  res.json({ ok: true });
});

app.delete("/api/brands/:id", (req, res) => {
  deleteBrand.run(req.params.id);
  res.json({ ok: true });
});

app.get("/api/workshops", (req, res) => {
  const { category } = req.query;
  let rows = listWorkshops.all();
  if (category) rows = rows.filter(r => r.category_id === category || r.category_name === category);
  const payload = rows.map((w) => {
    let sessions = listSessionsByWorkshop.all(w.id);
  if (sessions.length === 0 && w.date) {
    const sid = nanoid();
    insertSession.run(sid, w.id, w.date, "10:00", w.location || "", w.seats || 0, now());
    sessions = listSessionsByWorkshop.all(w.id);
  }
    return {
      ...w,
      images: JSON.parse(w.images || "[]"),
      featured: Boolean(w.featured),
      sessions
    };
  });
  res.json(payload);
});

app.get("/api/workshops/:id", (req, res) => {
  const w = getWorkshop.get(req.params.id);
  if (!w) return res.status(404).json({ error: "No encontrado" });
  const sessions = listSessionsByWorkshop.all(w.id);
  res.json({ ...w, images: JSON.parse(w.images || "[]"), featured: Boolean(w.featured), sessions });
});

app.post("/api/workshops", (req, res) => {
  const { title, description, price, date, location, seats, category_id, images, map_embed, featured } = req.body;
  if (!title || !description || !price || !location) {
    return res.status(400).json({ error: "Campos requeridos faltantes" });
  }
  const id = nanoid();
  const stamp = now();
  insertWorkshop.run(
    id,
    title,
    description,
    Number(price),
    date || "",
    location,
    Number(seats || 0),
    category_id || null,
    JSON.stringify(images || []),
    map_embed || "",
    featured ? 1 : 0,
    stamp,
    stamp
  );
  if (date) {
    insertSession.run(nanoid(), id, date, Number(seats || 0), stamp);
  }
  res.json({ id });
});

app.put("/api/workshops/:id", (req, res) => {
  const { title, description, price, date, location, seats, category_id, images, map_embed, featured } = req.body;
  updateWorkshop.run(
    title,
    description,
    Number(price),
    date || "",
    location,
    Number(seats || 0),
    category_id || null,
    JSON.stringify(images || []),
    map_embed || "",
    featured ? 1 : 0,
    now(),
    req.params.id
  );
  res.json({ ok: true });
});

app.delete("/api/workshops/:id", (req, res) => {
  deleteWorkshop.run(req.params.id);
  res.json({ ok: true });
});

app.get("/api/sessions", (req, res) => {
  const { workshop_id } = req.query;
  if (!workshop_id) return res.status(400).json({ error: "workshop_id requerido" });
  res.json(listSessionsByWorkshop.all(workshop_id));
});

app.post("/api/sessions", (req, res) => {
  const { workshop_id, date, time, location, seats } = req.body;
  if (!workshop_id || !date || !seats) {
    return res.status(400).json({ error: "Datos requeridos" });
  }
  const id = nanoid();
  insertSession.run(id, workshop_id, date, time || "10:00", location || "", Number(seats), now());
  res.json({ id });
});

app.delete("/api/sessions/:id", (req, res) => {
  deleteSession.run(req.params.id);
  res.json({ ok: true });
});

app.get("/api/reservations", (req, res) => {
  res.json(listReservations.all());
});

app.post("/api/reservations", (req, res) => {
  const { workshop_id, session_id, name, email, seats, reservation_date, status } = req.body;
  if (!workshop_id || !name || !email || !seats || !reservation_date) {
    return res.status(400).json({ error: "Datos requeridos" });
  }
  const id = nanoid();
  const finalStatus = status || "pending_payment";
  insertReservation.run(id, workshop_id, session_id || null, name, email, Number(seats), reservation_date, finalStatus, now());
  if (finalStatus === "paid") {
    sendPaidEmail({ id, workshop_id, session_id, name, email, seats, reservation_date }).catch(() => null);
  }
  res.json({ id, status: finalStatus });
});

app.post("/api/reservations/admin", (req, res) => {
  const { workshop_id, session_id, name, email, seats, reservation_date, status } = req.body;
  if (!workshop_id || !name || !email || !seats || !reservation_date) {
    return res.status(400).json({ error: "Datos requeridos" });
  }
  const id = nanoid();
  const finalStatus = status || "paid";
  insertReservation.run(id, workshop_id, session_id || null, name, email, Number(seats), reservation_date, finalStatus, now());
  if (finalStatus === "paid") {
    sendPaidEmail({ id, workshop_id, session_id, name, email, seats, reservation_date }).catch(() => null);
  }
  res.json({ id, status: finalStatus });
});

app.put("/api/reservations/:id", (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Status requerido" });
  updateReservationStatus.run(status, req.params.id);
  if (status === "paid") {
    const reservation = db.prepare("SELECT * FROM reservations WHERE id = ?").get(req.params.id);
    if (reservation) sendPaidEmail(reservation).catch(() => null);
  }
  res.json({ ok: true });
});

app.delete("/api/reservations/:id", (req, res) => {
  db.prepare("DELETE FROM reservations WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

app.get("/api/settings/:key", (req, res) => {
  const row = getSetting.get(req.params.key);
  res.json({ key: req.params.key, value: row ? row.value : "" });
});

const buildMapLink = (mapEmbed, location) => {
  if (mapEmbed) return mapEmbed;
  if (location) return `https://www.google.com/maps?q=${encodeURIComponent(location)}`;
  return "";
};

const transporter = SMTP_HOST && SMTP_USER && SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })
  : null;

const sendPaidEmail = async (reservation) => {
  if (!transporter) return;
  const workshop = getWorkshop.get(reservation.workshop_id);
  if (!workshop) return;
  const session = reservation.session_id ? getSession.get(reservation.session_id) : null;
  const sessionDate = session?.date || reservation.reservation_date;
  const location = session?.location || workshop.location;
  const mapLink = buildMapLink(workshop.map_embed, location);
  const subject = `Tu reserva está confirmada: ${workshop.title}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222">
      <h2>¡Reserva confirmada!</h2>
      <p>Hola ${reservation.name}, tu reserva está confirmada.</p>
      <p><strong>Taller:</strong> ${workshop.title}</p>
      <p><strong>Fecha:</strong> ${sessionDate}</p>
      <p><strong>Ubicación:</strong> ${location}</p>
      ${mapLink ? `<p><a href="${mapLink}">Cómo llegar</a></p>` : ""}
      <p>Gracias por ser parte de Artes y Oficios.</p>
    </div>
  `;
  await transporter.sendMail({
    from: SMTP_FROM,
    to: reservation.email,
    subject,
    html
  });
};

app.put("/api/settings/:key", (req, res) => {
  const { value } = req.body;
  upsertSetting.run(req.params.key, value ?? "");
  res.json({ ok: true });
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Archivo requerido" });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listo en http://localhost:${PORT}`);
});
