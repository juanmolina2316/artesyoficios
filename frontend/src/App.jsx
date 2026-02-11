import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const HOST = window.location.hostname || "localhost";
const API = `${window.location.protocol}//${HOST}:4000/api`;
const IMG_BASE = `${window.location.protocol}//${HOST}:4000`;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "media";
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const isSupabase = Boolean(supabase);

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0
});

const defaultHero = {
  title: "Talleres creativos con alma artesanal",
  subtitle: "Aprende oficios, conoce artistas y crea piezas que cuentan historias.",
  cta: "Reservar ahora",
  image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop",
  imagePosX: "50%",
  imagePosY: "50%",
  imageScale: 1,
  showBanner: true
};

const defaultAbout = {
  title: "Somos Artes y Oficios",
  text: "Una comunidad de talleres donde la creatividad se vuelve oficio. Diseñamos experiencias presenciales con materiales premium, guías expertas y un ritmo cercano.",
  images: []
};

const defaultContact = {
  instagram: "@artes_oficios_",
  email: "hola@artesyoficios.mx",
  phone: "+52 55 0000 0000",
  address: "Ciudad de México"
};

const defaultTheme = {
  bg: "#f7f2ec",
  bgSoft: "#f1ebe4",
  ink: "#1a1a1a",
  muted: "#5a544d",
  accent: "#d87a4b",
  accentDark: "#b85c33",
  card: "#ffffff",
  radius: "22px",
  shadow: "0 12px 30px rgba(17, 16, 15, 0.12)",
  headingFont: '"Playfair Display", serif',
  bodyFont: '"Manrope", sans-serif',
  h1Size: "30px",
  h2Size: "26px",
  bodySize: "16px",
  buttonSize: "14px",
  bgImage: "/uploads/banner-theme.png",
  bgPosX: "50%",
  bgPosY: "0%",
  bgScale: "100%"
};

const navItems = [
  { id: "inicio", label: "Inicio" },
  { id: "talleres", label: "Talleres" },
  { id: "agendar", label: "Agendar" },
  { id: "cancelar", label: "Cancelar" },
  { id: "empresas", label: "Empresas" },
  { id: "quienes", label: "Quiénes" },
  { id: "marcas", label: "Marcas" },
  { id: "contacto", label: "Contacto" }
];

const fetchJSON = async (url, options) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Error");
  }
  return res.json();
};

const sbInsert = async (table, payload) => {
  const { data, error } = await supabase.from(table).insert(payload).select();
  if (error) throw error;
  return data;
};

const sbUpdate = async (table, payload, match) => {
  const { data, error } = await supabase.from(table).update(payload).match(match).select();
  if (error) throw error;
  return data;
};

const sbDelete = async (table, match) => {
  const { error } = await supabase.from(table).delete().match(match);
  if (error) throw error;
};

const sbSelect = async (table, opts = {}) => {
  let q = supabase.from(table).select("*");
  if (opts.orderBy) q = q.order(opts.orderBy, { ascending: opts.asc ?? true });
  if (opts.eq) {
    Object.entries(opts.eq).forEach(([k, v]) => { q = q.eq(k, v); });
  }
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};

const uploadToSupabase = async (file) => {
  if (!supabase) throw new Error("Supabase no configurado");
  const ext = file.name.split(".").pop();
  const path = `uploads/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const uploadFile = async (file) => {
  if (isSupabase) {
    return uploadToSupabase(file);
  }
  const form = new FormData();
  form.append("file", file);
  const res = await fetchJSON(`${API}/upload`, { method: "POST", body: form });
  return res.url;
};

const resolveUrl = (value) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${IMG_BASE}${value}`;
  return value;
};

const normalizeUpload = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.pathname.startsWith("/uploads/")) return url.pathname;
  } catch {
    if (value.startsWith("/uploads/")) return value;
  }
  return value;
};

const buildMapSrc = (mapEmbed, location) => {
  if (mapEmbed) {
    try {
      const url = new URL(mapEmbed);
      const host = url.hostname;
      if (host.includes("google") || host.includes("goo.gl") || host.includes("maps.app.goo.gl")) {
        if (url.pathname.includes("/embed")) return mapEmbed;
        if (url.searchParams.get("output") === "embed") return mapEmbed;
        if (url.searchParams.has("q")) {
          url.searchParams.set("output", "embed");
          return url.toString();
        }
      }
    } catch {
      // fall through
    }
  }
  if (location) {
    return `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
  }
  return "";
};

const getCache = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    if (typeof fallback === "object" && fallback !== null && !Array.isArray(fallback)) {
      return { ...fallback, ...data };
    }
    return data;
  } catch {
    return fallback;
  }
};

const setCache = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const ImageUploader = ({ value = [], onChange }) => {
  const [uploading, setUploading] = useState(false);
  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const newUrls = [];
    try {
      for (const file of files) {
        const resUrl = await uploadFile(file);
        newUrls.push(resUrl);
      }
      onChange([...(value || []), ...newUrls]);
    } catch {
      alert("No se pudo subir la imagen. Verifica que el backend esté activo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="uploader">
      <label className="uploader-drop">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
        />
        <div>
          <strong>Arrastra o toca para subir</strong>
          <span>{uploading ? "Subiendo..." : "JPG, PNG o HEIC"}</span>
        </div>
      </label>
      <div className="uploader-grid">
        {(value || []).map((url) => (
          <div className="thumb" key={url}>
            <img src={resolveUrl(url)} alt="" />
            <button type="button" onClick={() => onChange(value.filter((u) => u !== url))}>Quitar</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const SingleImageUploader = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const resUrl = await uploadFile(file);
      onChange(resUrl);
    } catch {
      alert("No se pudo subir la imagen. Verifica que el backend esté activo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="uploader">
      <label className="uploader-drop">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div>
          <strong>{uploading ? "Subiendo..." : "Toca para subir"}</strong>
          <span>Recomendado 1600x900</span>
        </div>
      </label>
      {value && (
        <div className="thumb">
          <img src={resolveUrl(value)} alt="" />
          <button type="button" onClick={() => onChange("")}>Quitar</button>
        </div>
      )}
    </div>
  );
};

const LogoUploader = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const resUrl = await uploadFile(file);
      onChange(resUrl);
    } catch {
      alert("No se pudo subir la imagen. Verifica que el backend esté activo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="uploader">
      <label className="uploader-drop">
        <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
        <div>
          <strong>{uploading ? "Subiendo..." : "Subir logo"}</strong>
          <span>PNG o SVG</span>
        </div>
      </label>
      {value && (
        <div className="thumb">
          <img src={resolveUrl(value)} alt="" />
          <button type="button" onClick={() => onChange("")}>Quitar</button>
        </div>
      )}
    </div>
  );
};

const BottomNav = () => (
  <nav className="bottom-nav">
    {navItems.map((item) => (
      <a key={item.id} href={`#${item.id}`}>{item.label}</a>
    ))}
  </nav>
);

const App = () => {
  const [workshops, setWorkshops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [hero, setHero] = useState(() => getCache("ao_hero", defaultHero));
  const [about, setAbout] = useState(() => getCache("ao_about", defaultAbout));
  const [contact, setContact] = useState(() => getCache("ao_contact", defaultContact));
  const [theme, setTheme] = useState(() => getCache("ao_theme", defaultTheme));
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedWorkshop, setSelectedWorkshop] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [highlightedSession, setHighlightedSession] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminPinStored, setAdminPinStored] = useState(() => getCache("ao_pin", ""));
  const [adminPinNew, setAdminPinNew] = useState("");

  const masterPin = "100202";
  const defaultPin = "290798";

  const [adminReservation, setAdminReservation] = useState({
    workshop_id: "",
    session_id: "",
    name: "",
    email: "",
    seats: "",
    reservation_date: "",
    status: "paid"
  });

  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState({ name: "", logo_url: "" });
  const [workshopForm, setWorkshopForm] = useState({
    id: "",
    title: "",
    description: "",
    price: "",
    location: "",
    category_id: "",
    images: [],
    map_embed: "",
    featured: false
  });
  const [workshopFormKey, setWorkshopFormKey] = useState(0);
  const [sessionForm, setSessionForm] = useState({
    workshop_id: "",
    date: "",
    time: "",
    location: "",
    seats: ""
  });

  const [companyForm, setCompanyForm] = useState({
    company: "",
    contact: "",
    email: "",
    phone: "",
    attendees: "",
    preferredDate: "",
    message: ""
  });

  const filteredWorkshops = useMemo(() => {
    if (activeCategory === "all") return workshops;
    return workshops.filter((w) => w.category_id === activeCategory);
  }, [workshops, activeCategory]);

  const featured = workshops.filter((w) => w.featured).slice(0, 4);

  const selectedWorkshopObj = useMemo(
    () => workshops.find((w) => w.id === selectedWorkshop),
    [workshops, selectedWorkshop]
  );
  const selectedSessionObj = useMemo(
    () => selectedWorkshopObj?.sessions?.find((s) => s.id === selectedSession),
    [selectedWorkshopObj, selectedSession]
  );

  const loadAll = async () => {
    if (isSupabase) {
      const [w, c, b, r, s] = await Promise.all([
        sbSelect("workshops", { orderBy: "created_at", asc: false }),
        sbSelect("categories", { orderBy: "created_at", asc: false }),
        sbSelect("brands", { orderBy: "created_at", asc: false }),
        sbSelect("reservations", { orderBy: "created_at", asc: false }),
        sbSelect("sessions", { orderBy: "date", asc: true })
      ]);
      const sessionsByWorkshop = s.reduce((acc, sess) => {
        (acc[sess.workshop_id] ||= []).push(sess);
        return acc;
      }, {});
      const sessionsById = s.reduce((acc, sess) => {
        acc[sess.id] = sess;
        return acc;
      }, {});
      const workshopsWithSessions = w.map((item) => ({
        ...item,
        images: item.images || [],
        featured: Boolean(item.featured),
        sessions: sessionsByWorkshop[item.id] || []
      }));
      const workshopsById = workshopsWithSessions.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
      setWorkshops(workshopsWithSessions);
      setCategories(c);
      setBrands(b);
      setReservations(r.map((resv) => ({
        ...resv,
        workshop_title: workshopsById[resv.workshop_id]?.title || "",
        session_date: sessionsById[resv.session_id]?.date || ""
      })));
      return;
    }
    const [w, c, b, r] = await Promise.all([
      fetchJSON(`${API}/workshops`),
      fetchJSON(`${API}/categories`),
      fetchJSON(`${API}/brands`),
      fetchJSON(`${API}/reservations`)
    ]);
    setWorkshops(w.map((item) => ({
      ...item,
      images: (item.images || []).map((img) => normalizeUpload(img))
    })));
    setCategories(c);
    setBrands(b.map((item) => ({ ...item, logo_url: normalizeUpload(item.logo_url) })));
    setReservations(r);
  };

  const loadSettings = async () => {
    try {
      if (isSupabase) {
        const rows = await sbSelect("settings");
        const getVal = (key) => rows.find((r) => r.key === key)?.value || "";
        const heroVal = getVal("hero");
        const aboutVal = getVal("about");
        const pinVal = getVal("admin_pin");
        const themeVal = getVal("theme");
        const contactVal = getVal("contact");

        if (heroVal) {
          const v = JSON.parse(heroVal);
          setHero(v);
          setCache("ao_hero", v);
        }
        if (aboutVal) {
          const v = JSON.parse(aboutVal);
          setAbout(v);
          setCache("ao_about", v);
        }
        if (themeVal) {
          const v = { ...defaultTheme, ...JSON.parse(themeVal) };
          setTheme(v);
          setCache("ao_theme", v);
        }
        if (contactVal) {
          const v = { ...defaultContact, ...JSON.parse(contactVal) };
          setContact(v);
          setCache("ao_contact", v);
        }
        if (pinVal) {
          setAdminPinStored(pinVal);
          setAdminPinNew(pinVal);
          setCache("ao_pin", pinVal);
        } else if (!adminPinStored) {
          setAdminPinStored(defaultPin);
          setAdminPinNew(defaultPin);
          setCache("ao_pin", defaultPin);
          await sbInsert("settings", [{ key: "admin_pin", value: defaultPin }]).catch(() => null);
        }
        return;
      }

      const heroRes = await fetchJSON(`${API}/settings/hero`).catch(() => ({ value: "" }));
      const aboutRes = await fetchJSON(`${API}/settings/about`).catch(() => ({ value: "" }));
      const pinRes = await fetchJSON(`${API}/settings/admin_pin`).catch(() => ({ value: "" }));
      const themeRes = await fetchJSON(`${API}/settings/theme`).catch(() => ({ value: "" }));
      const contactRes = await fetchJSON(`${API}/settings/contact`).catch(() => ({ value: "" }));

      if (heroRes.value) {
        const v = JSON.parse(heroRes.value);
        if (v.image) v.image = normalizeUpload(v.image);
        setHero(v);
        setCache("ao_hero", v);
      }
      if (aboutRes.value) {
        const v = JSON.parse(aboutRes.value);
        setAbout(v);
        setCache("ao_about", v);
      }
      if (themeRes.value) {
        const v = { ...defaultTheme, ...JSON.parse(themeRes.value) };
        if (v.bgImage) v.bgImage = normalizeUpload(v.bgImage);
        setTheme(v);
        setCache("ao_theme", v);
      }
      if (contactRes.value) {
        const v = { ...defaultContact, ...JSON.parse(contactRes.value) };
        setContact(v);
        setCache("ao_contact", v);
      }
      if (pinRes.value) {
        setAdminPinStored(pinRes.value);
        setAdminPinNew(pinRes.value);
        setCache("ao_pin", pinRes.value);
      } else if (!adminPinStored) {
        setAdminPinStored(defaultPin);
        setAdminPinNew(defaultPin);
        setCache("ao_pin", defaultPin);
        await fetchJSON(`${API}/settings/admin_pin`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: defaultPin })
        }).catch(() => null);
      }
    } catch {
      if (!adminPinStored) {
        setAdminPinStored(defaultPin);
        setAdminPinNew(defaultPin);
        setCache("ao_pin", defaultPin);
      }
    }
  };

  useEffect(() => {
    loadAll().catch(() => null);
    loadSettings();
  }, []);

  useEffect(() => {
    if (selectedWorkshopObj?.sessions?.length) {
      const first = selectedWorkshopObj.sessions[0];
      setSelectedSession(first.id);
      setHighlightedSession(first.id);
      setBookingDate(first.date);
    } else {
      setSelectedSession("");
      setHighlightedSession("");
      setBookingDate("");
    }
  }, [selectedWorkshopObj]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--bg", theme.bg);
    root.style.setProperty("--bg-soft", theme.bgSoft);
    root.style.setProperty("--ink", theme.ink);
    root.style.setProperty("--muted", theme.muted);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-dark", theme.accentDark);
    root.style.setProperty("--card", theme.card);
    root.style.setProperty("--radius", theme.radius);
    root.style.setProperty("--shadow", theme.shadow);
    root.style.setProperty("--heading-font", theme.headingFont);
    root.style.setProperty("--body-font", theme.bodyFont);
    root.style.setProperty("--h1-size", theme.h1Size);
    root.style.setProperty("--h2-size", theme.h2Size);
    root.style.setProperty("--body-size", theme.bodySize);
    root.style.setProperty("--button-size", theme.buttonSize);
    root.style.setProperty("--bg-image", theme.bgImage ? `url(\"${resolveUrl(theme.bgImage)}\")` : "none");
    root.style.setProperty("--bg-pos-x", theme.bgPosX);
    root.style.setProperty("--bg-pos-y", theme.bgPosY);
    root.style.setProperty("--bg-scale", theme.bgScale);
  }, [theme]);

  const saveWorkshop = async () => {
    if (!workshopForm.title || !workshopForm.description || !workshopForm.price || !workshopForm.location) {
      alert("Completa título, descripción, precio y ubicación.");
      return;
    }
    if (isSupabase && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
      alert("Supabase no está configurado en este entorno.");
      return;
    }
    const payload = {
      ...workshopForm,
      price: Number(workshopForm.price),
      featured: Boolean(workshopForm.featured),
      images: workshopForm.images || [],
      category_id: workshopForm.category_id || null
    };
    try {
      if (isSupabase) {
        if (payload.id) {
          await sbUpdate("workshops", { ...payload, updated_at: new Date().toISOString() }, { id: payload.id });
        } else {
          await sbInsert("workshops", [{
            ...payload,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        }
      } else {
        if (payload.id) {
          await fetchJSON(`${API}/workshops/${payload.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } else {
          await fetchJSON(`${API}/workshops`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
      }
    } catch (err) {
      alert(err?.message || "No se pudo guardar el taller.");
      return;
    }
    setWorkshopForm({
      id: "",
      title: "",
      description: "",
      price: "",
      location: "",
      category_id: "",
      images: [],
      map_embed: "",
      featured: false
    });
    setWorkshopFormKey((k) => k + 1);
    await loadAll();
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!selectedSession) {
      alert("Selecciona una fecha disponible.");
      return;
    }
    const reservationPayload = {
      id: crypto.randomUUID(),
      workshop_id: form.get("workshop"),
      session_id: selectedSession,
      name: form.get("name"),
      email: form.get("email"),
      seats: Number(form.get("seats")),
      reservation_date: bookingDate,
      status: "pending_payment",
      created_at: new Date().toISOString()
    };
    if (isSupabase) {
      await sbInsert("reservations", [reservationPayload]);
    } else {
      await fetchJSON(`${API}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationPayload)
      });
    }
    e.currentTarget.reset();
    await loadAll();
    alert("Solicitud registrada. La reserva se confirma solo después del pago.");
  };

  const adminLogin = () => {
    if (adminPin === masterPin) {
      setAdminAuthed(true);
      return;
    }
    const effectivePin = adminPinStored || defaultPin;
    if (adminPin === effectivePin) {
      setAdminAuthed(true);
    } else {
      alert("PIN incorrecto");
    }
  };

  const saveSettings = async () => {
    if (isSupabase) {
      await sbInsert("settings", [{ key: "hero", value: JSON.stringify(hero) }]).catch(async () => {
        await sbUpdate("settings", { value: JSON.stringify(hero) }, { key: "hero" });
      });
      await sbInsert("settings", [{ key: "about", value: JSON.stringify(about) }]).catch(async () => {
        await sbUpdate("settings", { value: JSON.stringify(about) }, { key: "about" });
      });
    } else {
      await fetchJSON(`${API}/settings/hero`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: JSON.stringify(hero) })
      });
      await fetchJSON(`${API}/settings/about`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: JSON.stringify(about) })
      });
    }
    setCache("ao_hero", hero);
    setCache("ao_about", about);
    alert("Textos actualizados");
  };

  const saveTheme = async () => {
    if (isSupabase) {
      await sbInsert("settings", [{ key: "theme", value: JSON.stringify(theme) }]).catch(async () => {
        await sbUpdate("settings", { value: JSON.stringify(theme) }, { key: "theme" });
      });
    } else {
      await fetchJSON(`${API}/settings/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: JSON.stringify(theme) })
      });
    }
    setCache("ao_theme", theme);
    alert("Diseño actualizado");
  };

  const saveAdminPin = async () => {
    if (!adminPinNew) {
      alert("Escribe un PIN");
      return;
    }
    if (isSupabase) {
      await sbInsert("settings", [{ key: "admin_pin", value: adminPinNew }]).catch(async () => {
        await sbUpdate("settings", { value: adminPinNew }, { key: "admin_pin" });
      });
    } else {
      await fetchJSON(`${API}/settings/admin_pin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: adminPinNew })
      });
    }
    setAdminPinStored(adminPinNew);
    setAdminPin("");
    setCache("ao_pin", adminPinNew);
    alert("PIN actualizado");
  };

  const saveContact = async () => {
    if (isSupabase) {
      await sbInsert("settings", [{ key: "contact", value: JSON.stringify(contact) }]).catch(async () => {
        await sbUpdate("settings", { value: JSON.stringify(contact) }, { key: "contact" });
      });
    } else {
      await fetchJSON(`${API}/settings/contact`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: JSON.stringify(contact) })
      });
    }
    setCache("ao_contact", contact);
    alert("Contacto actualizado");
  };

  return (
    <div className="app">
      <header className="top-bar">
        <div className="logo">
          <span>Artes</span>
          <strong>y Oficios</strong>
        </div>
        <button className="admin-pill" onClick={() => setAdminOpen(true)}>Admin</button>
      </header>

      <section id="inicio" className="hero">
        <div className={`hero-media ${hero.showBanner ? "" : "hero-media--empty"}`}>
          {hero.showBanner && (
            <img
              src={resolveUrl(hero.image)}
              alt=""
              style={{
                objectPosition: `${hero.imagePosX} ${hero.imagePosY}`,
                transform: `scale(${hero.imageScale})`
              }}
            />
          )}
        </div>
        <div className="hero-content overlay">
          <p className="eyebrow">Instagram: {contact.instagram}</p>
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>
          <a className="primary" href="#agendar">{hero.cta}</a>
        </div>
      </section>

      <section className="featured">
        <div className="section-head">
          <h2>Talleres destacados</h2>
          <p>Curados para quienes aman crear con las manos.</p>
        </div>
        <div className="card-row">
          {featured.map((w) => (
            <article className="work-card" key={w.id}>
              <div className="work-image">
                <img src={resolveUrl(w.images?.[0] || hero.image)} alt="" />
              </div>
              <div className="work-body">
                <h3>{w.title}</h3>
                <p>{w.description}</p>
                <div className="meta">
                  <span>{currency.format(w.price)}</span>
                  {!w.sessions?.length && (
                    <span>{w.date}</span>
                  )}
                </div>
                <a className="secondary" href="#agendar" onClick={() => setSelectedWorkshop(w.id)}>Reservar</a>
              </div>
            </article>
          ))}
          {featured.length === 0 && (
            <div className="empty">Agrega talleres destacados desde el panel admin.</div>
          )}
        </div>
      </section>

      <section id="talleres" className="workshops">
        <div className="section-head">
          <h2>Explora los talleres</h2>
          <p>Filtra por categoría y encuentra tu siguiente experiencia.</p>
        </div>
        <div className="filters">
          <button className={activeCategory === "all" ? "active" : ""} onClick={() => setActiveCategory("all")}>Todos</button>
          {categories.map((c) => (
            <button key={c.id} className={activeCategory === c.id ? "active" : ""} onClick={() => setActiveCategory(c.id)}>{c.name}</button>
          ))}
        </div>
        <div className="work-grid">
          {filteredWorkshops.map((w) => (
            <article className="work-card large" key={w.id}>
              <div className="work-image">
                <img src={resolveUrl(w.images?.[0] || hero.image)} alt="" />
              </div>
              <div className="work-body">
                <div className="work-header">
                  <h3>{w.title}</h3>
                  <span className="badge">{w.category_name || "Taller"}</span>
                </div>
                <p>{w.description}</p>
                <div className="meta-grid">
                  <span>{currency.format(w.price)}</span>
                  {!w.sessions?.length && (
                    <span>{w.date}</span>
                  )}
                  <span>{w.location}</span>
                  {!w.sessions?.length && (
                    <span>{w.seats} cupos</span>
                  )}
                </div>
                {w.sessions?.length > 0 && (
                  <div className="session-list">
                    {w.sessions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`session-chip ${highlightedSession === s.id ? "active" : ""}`}
                        onClick={() => {
                          setSelectedWorkshop(w.id);
                          setSelectedSession(s.id);
                          setHighlightedSession(s.id);
                          setBookingDate(s.date);
                          window.location.hash = "agendar";
                        }}
                      >
                        {s.date}{s.time ? ` · ${s.time}` : ""}
                      </button>
                    ))}
                  </div>
                )}
                <div className="card-actions">
                  <a className="secondary" href="#agendar" onClick={() => setSelectedWorkshop(w.id)}>Reservar</a>
                </div>
              </div>
              <div className="map-embed">
                {buildMapSrc(w.map_embed, (w.sessions?.[0]?.location || w.location)) ? (
                  <iframe
                    title={`Mapa ${w.title}`}
                    src={buildMapSrc(w.map_embed, (w.sessions?.[0]?.location || w.location))}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="map-placeholder">Agrega el link de Google Maps en admin</div>
                )}
              </div>
            </article>
          ))}
          {filteredWorkshops.length === 0 && (
            <div className="empty">Aún no hay talleres en esta categoría.</div>
          )}
        </div>
      </section>

      <section id="agendar" className="booking">
        <div className="section-head">
          <h2>Agendar taller</h2>
          <p>Reserva tu lugar en minutos.</p>
        </div>
        <form className="booking-form" onSubmit={handleReserve}>
          <label>
            Taller
            <select name="workshop" required value={selectedWorkshop} onChange={(e) => setSelectedWorkshop(e.target.value)}>
              <option value="">Selecciona un taller</option>
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>
          </label>
          <label>
            Fecha (sesión)
            <select
              name="date"
              required
              value={selectedSession}
              onChange={(e) => {
                const sid = e.target.value;
                setSelectedSession(sid);
                const s = selectedWorkshopObj?.sessions?.find((x) => x.id === sid);
                setBookingDate(s?.date || "");
              }}
            >
              <option value="">Selecciona una fecha</option>
              {(selectedWorkshopObj?.sessions || []).map((s) => (
                <option key={s.id} value={s.id}>{s.date} · {s.time || "10:00"}</option>
              ))}
            </select>
          </label>
          <div className="booking-info">
            <div>
              <strong>Ubicación</strong>
              <span>{selectedSessionObj?.location || selectedWorkshopObj?.location || "Selecciona un taller"}</span>
            </div>
            <div>
              <strong>Cupos</strong>
              <span>
                {selectedSessionObj?.seats ? `${selectedSessionObj.seats} lugares` : "—"}
                {selectedSessionObj?.time ? ` · ${selectedSessionObj.time}` : ""}
              </span>
            </div>
          </div>
          <label>
            Lugares
            <input type="number" min="1" name="seats" required />
          </label>
          <label>
            Nombre
            <input type="text" name="name" required placeholder="Tu nombre" />
          </label>
          <label>
            Email
            <input type="email" name="email" required placeholder="tu@email.com" />
          </label>
          <button className="primary" type="submit">Reservar</button>
        </form>
        <div className="payments">
          <h3>Pago seguro</h3>
          <p>Stripe, PayPal y Apple Pay listos para México. Conecta tus llaves en el backend para activar pagos reales.</p>
          <div className="pay-buttons">
            <button type="button" className="pay">Pagar con Stripe</button>
            <button type="button" className="pay alt">Pagar con PayPal</button>
            <button type="button" className="pay">Apple Pay</button>
          </div>
        </div>
      </section>

      <section id="cancelar" className="cancel">
        <div className="section-head">
          <h2>Cancelar reserva</h2>
          <p>Si necesitas cancelar, escríbenos y te ayudamos.</p>
        </div>
        <div className="cancel-card">
          <h4>Política de cancelación</h4>
          <p>Solo se puede cancelar hasta 24 horas antes del evento. Se reembolsa el 50% del costo del taller.</p>
          <button className="secondary" type="button" onClick={() => window.location.hash = "contacto"}>Contactar para cancelar</button>
        </div>
      </section>

      <section id="empresas" className="enterprise">
        <div className="section-head">
          <h2>Talleres para empresas</h2>
          <p>Cotiza experiencias personalizadas para tu equipo.</p>
        </div>
        <div className="enterprise-card">
          <form
            className="booking-form"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Gracias. Recibimos tu solicitud y te contactaremos pronto.");
              setCompanyForm({
                company: "",
                contact: "",
                email: "",
                phone: "",
                attendees: "",
                preferredDate: "",
                message: ""
              });
            }}
          >
            <label>
              Empresa
              <input
                type="text"
                required
                value={companyForm.company}
                onChange={(e) => setCompanyForm({ ...companyForm, company: e.target.value })}
              />
            </label>
            <label>
              Contacto
              <input
                type="text"
                required
                value={companyForm.contact}
                onChange={(e) => setCompanyForm({ ...companyForm, contact: e.target.value })}
              />
            </label>
            <label>
              Email corporativo
              <input
                type="email"
                required
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
              />
            </label>
            <label>
              Teléfono
              <input
                type="tel"
                required
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
              />
            </label>
            <label>
              Asistentes
              <input
                type="number"
                min="5"
                required
                value={companyForm.attendees}
                onChange={(e) => setCompanyForm({ ...companyForm, attendees: e.target.value })}
              />
            </label>
            <label>
              Fecha preferida
              <input
                type="date"
                required
                value={companyForm.preferredDate}
                onChange={(e) => setCompanyForm({ ...companyForm, preferredDate: e.target.value })}
              />
            </label>
            <label>
              Detalles del taller
              <textarea
                required
                value={companyForm.message}
                onChange={(e) => setCompanyForm({ ...companyForm, message: e.target.value })}
                placeholder="Cuéntanos el objetivo, duración y tipo de taller."
              />
            </label>
            <button className="primary" type="submit">Enviar cotización</button>
          </form>
        </div>
      </section>

      <section id="quienes" className="about">
        <div className="section-head">
          <h2>{about.title}</h2>
          <p>{about.text}</p>
        </div>
        {about.images?.length > 0 && (
          <div className="about-photos">
            {about.images.map((img) => (
              <img key={img} src={resolveUrl(img)} alt="" />
            ))}
          </div>
        )}
        <div className="about-grid">
          <div className="about-card">
            <h4>Experiencias premium</h4>
            <p>Materiales seleccionados, guías expertas y espacios inspiradores.</p>
          </div>
          <div className="about-card">
            <h4>Comunidad creativa</h4>
            <p>Conecta con personas que aman crear y aprender.</p>
          </div>
          <div className="about-card">
            <h4>Diseño consciente</h4>
            <p>Proceso artesanal con identidad y propósito.</p>
          </div>
        </div>
      </section>

      <section id="marcas" className="brands">
        <div className="section-head">
          <h2>Marcas aliadas</h2>
          <p>Colaboraciones que elevan cada taller.</p>
        </div>
        <div className="brand-carousel">
          {brands.map((b) => (
            <div className="brand" key={b.id}>
              <img src={resolveUrl(b.logo_url)} alt={b.name} />
            </div>
          ))}
          {brands.length === 0 && (
            <div className="empty">Agrega logos desde el panel admin.</div>
          )}
        </div>
      </section>

      <section id="contacto" className="contact">
        <div className="section-head">
          <h2>Contacto</h2>
          <p>Escríbenos para talleres privados o alianzas.</p>
        </div>
        <div className="contact-card">
          <div>
            <h4>Instagram</h4>
            <p>{contact.instagram}</p>
          </div>
          <div>
            <h4>Email</h4>
            <p>{contact.email}</p>
          </div>
          <div>
            <h4>Teléfono</h4>
            <p>{contact.phone}</p>
          </div>
          <div>
            <h4>Ubicación</h4>
            <p>{contact.address}</p>
          </div>
        </div>
      </section>

      {adminOpen && (
        <div className="admin">
          <div className="admin-card">
            <button className="close" onClick={() => setAdminOpen(false)}>Cerrar</button>
            {!adminAuthed ? (
              <div className="admin-login">
                <h3>Panel Admin</h3>
                <p>Ingresa tu PIN de administrador.</p>
                <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="PIN" />
                <button className="primary" onClick={adminLogin}>Entrar</button>
              </div>
            ) : (
              <div className="admin-body">
                <h3>Administración</h3>
                <div className="admin-section" key={workshopFormKey}>
                  <h4>Crear/Editar Taller</h4>
                  <div className="form-grid">
                    <input placeholder="Título" value={workshopForm.title} onChange={(e) => setWorkshopForm({ ...workshopForm, title: e.target.value })} />
                    <input placeholder="Precio" type="number" value={workshopForm.price} onChange={(e) => setWorkshopForm({ ...workshopForm, price: e.target.value })} />
                    <input placeholder="Ubicación" value={workshopForm.location} onChange={(e) => setWorkshopForm({ ...workshopForm, location: e.target.value })} />
                    <select value={workshopForm.category_id} onChange={(e) => setWorkshopForm({ ...workshopForm, category_id: e.target.value })}>
                      <option value="">Categoría</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <textarea placeholder="Descripción" value={workshopForm.description} onChange={(e) => setWorkshopForm({ ...workshopForm, description: e.target.value })} />
                  <input placeholder="Link Google Maps (embed o compartir)" value={workshopForm.map_embed} onChange={(e) => setWorkshopForm({ ...workshopForm, map_embed: e.target.value })} />
                  <label className="check">
                    <input type="checkbox" checked={workshopForm.featured} onChange={(e) => setWorkshopForm({ ...workshopForm, featured: e.target.checked })} />
                    Destacado
                  </label>
                  <ImageUploader value={workshopForm.images} onChange={(images) => setWorkshopForm({ ...workshopForm, images })} />
                  <button type="button" className="primary" onClick={saveWorkshop}>Guardar taller</button>

                  <div className="admin-list">
                    {workshops.map((w) => (
                      <div key={w.id} className="admin-item">
                        <div>
                          <strong>{w.title}</strong>
                          <small>{(w.sessions?.[0]?.date || w.date || "Sin fecha")} · {currency.format(w.price)}</small>
                        </div>
                        <div>
                          <button onClick={() => { setWorkshopForm({ ...w, images: w.images || [] }); setSessionForm({ ...sessionForm, workshop_id: w.id }); }}>Editar</button>
                          <button className="danger" onClick={async () => { 
                            if (isSupabase) {
                              await sbDelete("workshops", { id: w.id });
                            } else {
                              await fetchJSON(`${API}/workshops/${w.id}`, { method: "DELETE" });
                            }
                            await loadAll();
                          }}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="admin-section">
                    <h4>Sesiones</h4>
                    <div className="form-grid">
                      <select value={sessionForm.workshop_id} onChange={(e) => setSessionForm({ ...sessionForm, workshop_id: e.target.value })}>
                        <option value="">Taller</option>
                        {workshops.map((w) => (
                          <option key={w.id} value={w.id}>{w.title}</option>
                        ))}
                      </select>
                      <input type="date" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} />
                      <input type="time" value={sessionForm.time} onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })} />
                      <input type="text" placeholder="Lugar (sesión)" value={sessionForm.location} onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })} />
                      <input type="number" placeholder="Cupos" value={sessionForm.seats} onChange={(e) => setSessionForm({ ...sessionForm, seats: e.target.value })} />
                      <button
                        onClick={async () => {
                          if (!sessionForm.workshop_id || !sessionForm.date || !sessionForm.seats) {
                            alert("Completa taller, fecha y cupos.");
                            return;
                          }
                          try {
                            if (isSupabase) {
                              await sbInsert("sessions", [{
                                id: crypto.randomUUID(),
                                workshop_id: sessionForm.workshop_id,
                                date: sessionForm.date,
                                time: sessionForm.time || "10:00",
                                location: sessionForm.location || "",
                                seats: Number(sessionForm.seats),
                                created_at: new Date().toISOString()
                              }]);
                            } else {
                              await fetchJSON(`${API}/sessions`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  workshop_id: sessionForm.workshop_id,
                                  date: sessionForm.date,
                                  time: sessionForm.time,
                                  location: sessionForm.location,
                                  seats: Number(sessionForm.seats)
                                })
                              });
                            }
                            setSessionForm({ workshop_id: sessionForm.workshop_id, date: "", time: "", location: "", seats: "" });
                            await loadAll();
                          } catch (err) {
                            alert(err?.message || "No se pudo guardar la sesión.");
                          }
                        }}
                      >
                        Agregar sesión
                      </button>
                    </div>
                    <div className="admin-list">
                      {(workshops.find((w) => w.id === sessionForm.workshop_id)?.sessions || []).map((s) => (
                        <div key={s.id} className="admin-item">
                          <div>
                            <strong>{s.date} · {s.time || "10:00"}</strong>
                            <small>{s.location || "Sin ubicación"} · {s.seats} cupos</small>
                          </div>
                          <button className="danger" onClick={async () => { 
                            if (isSupabase) {
                              await sbDelete("sessions", { id: s.id });
                            } else {
                              await fetchJSON(`${API}/sessions/${s.id}`, { method: "DELETE" });
                            }
                            await loadAll();
                          }}>Eliminar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="admin-section">
                  <h4>Categorías</h4>
                  <div className="inline-form">
                    <input placeholder="Nueva categoría" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                    <button onClick={async () => { 
                      if (isSupabase) {
                        await sbInsert("categories", [{ id: crypto.randomUUID(), name: newCategory, created_at: new Date().toISOString() }]);
                      } else {
                        await fetchJSON(`${API}/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCategory }) });
                      }
                      setNewCategory("");
                      await loadAll();
                    }}>Agregar</button>
                  </div>
                  <div className="chip-row">
                    {categories.map((c) => (
                      <div className="chip" key={c.id}>
                        <span>{c.name}</span>
                        <button onClick={async () => { 
                          if (isSupabase) {
                            await sbDelete("categories", { id: c.id });
                          } else {
                            await fetchJSON(`${API}/categories/${c.id}`, { method: "DELETE" });
                          }
                          await loadAll();
                        }}>x</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-section">
                  <h4>Marcas</h4>
                  <div className="inline-form">
                    <input placeholder="Nombre" value={newBrand.name} onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })} />
                    <button onClick={async () => { 
                      if (isSupabase) {
                        await sbInsert("brands", [{ id: crypto.randomUUID(), name: newBrand.name, logo_url: newBrand.logo_url, created_at: new Date().toISOString() }]);
                      } else {
                        await fetchJSON(`${API}/brands`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newBrand) });
                      }
                      setNewBrand({ name: "", logo_url: "" });
                      await loadAll();
                    }}>Agregar</button>
                  </div>
                  <LogoUploader value={newBrand.logo_url} onChange={(logo_url) => setNewBrand({ ...newBrand, logo_url })} />
                  <div className="admin-list">
                    {brands.map((b) => (
                      <div key={b.id} className="admin-item">
                        <div>
                          <strong>{b.name}</strong>
                          <small>{b.logo_url}</small>
                        </div>
                        <div>
                          <button onClick={() => setNewBrand({ name: b.name, logo_url: b.logo_url })}>Editar</button>
                          <button className="danger" onClick={async () => { 
                            if (isSupabase) {
                              await sbDelete("brands", { id: b.id });
                            } else {
                              await fetchJSON(`${API}/brands/${b.id}`, { method: "DELETE" });
                            }
                            await loadAll();
                          }}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-section">
                  <h4>Reservas</h4>
                  <div className="form-grid">
                    <select value={adminReservation.workshop_id} onChange={(e) => setAdminReservation({ ...adminReservation, workshop_id: e.target.value })}>
                      <option value="">Taller</option>
                      {workshops.map((w) => (
                        <option key={w.id} value={w.id}>{w.title}</option>
                      ))}
                    </select>
                    <select value={adminReservation.session_id} onChange={(e) => setAdminReservation({ ...adminReservation, session_id: e.target.value })}>
                      <option value="">Sesión</option>
                      {(workshops.find((w) => w.id === adminReservation.workshop_id)?.sessions || []).map((s) => (
                        <option key={s.id} value={s.id}>{s.date}</option>
                      ))}
                    </select>
                    <input placeholder="Nombre" value={adminReservation.name} onChange={(e) => setAdminReservation({ ...adminReservation, name: e.target.value })} />
                    <input placeholder="Email" value={adminReservation.email} onChange={(e) => setAdminReservation({ ...adminReservation, email: e.target.value })} />
                    <input placeholder="Lugares" type="number" value={adminReservation.seats} onChange={(e) => setAdminReservation({ ...adminReservation, seats: e.target.value })} />
                    <input placeholder="Fecha" type="date" value={adminReservation.reservation_date} onChange={(e) => setAdminReservation({ ...adminReservation, reservation_date: e.target.value })} />
                    <select value={adminReservation.status} onChange={(e) => setAdminReservation({ ...adminReservation, status: e.target.value })}>
                      <option value="paid">Pagado</option>
                      <option value="pending_payment">Pendiente</option>
                    </select>
                    <button
                      onClick={async () => {
                        await fetchJSON(`${API}/reservations/admin`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            ...adminReservation,
                            seats: Number(adminReservation.seats)
                          })
                        });
                        setAdminReservation({ workshop_id: "", session_id: "", name: "", email: "", seats: "", reservation_date: "", status: "paid" });
                        await loadAll();
                      }}
                    >
                      Agregar manual
                    </button>
                  </div>
                  <div className="admin-list">
                    {reservations.map((r) => (
                      <div key={r.id} className="admin-item">
                        <div>
                          <strong>{r.workshop_title}</strong>
                          <small>{r.name} · {r.seats} lugares · {(r.session_date || r.reservation_date)}</small>
                        </div>
                        <div>
                          <span className="status">{r.status}</span>
                          {r.status !== "paid" && (
                            <button
                              onClick={async () => {
                          if (isSupabase) {
                            await sbUpdate("reservations", { status: "paid" }, { id: r.id });
                          } else {
                            await fetchJSON(`${API}/reservations/${r.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "paid" })
                            });
                          }
                          await loadAll();
                        }}
                      >
                        Marcar pagado
                      </button>
                    )}
                    <button
                      className="danger"
                      onClick={async () => {
                        if (isSupabase) {
                          await sbDelete("reservations", { id: r.id });
                        } else {
                          await fetchJSON(`${API}/reservations/${r.id}`, { method: "DELETE" });
                        }
                        await loadAll();
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                      </div>
                    ))}
                    {reservations.length === 0 && <div className="empty">Sin reservas aún.</div>}
                  </div>
                </div>

                <div className="admin-section">
                  <h4>Textos</h4>
                  <div className="form-grid">
                    <input placeholder="Título hero" value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
                    <input placeholder="CTA" value={hero.cta} onChange={(e) => setHero({ ...hero, cta: e.target.value })} />
                  </div>
                  <textarea placeholder="Subtítulo hero" value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} />
                  <div>
                    <label className="check">
                      <span>Banner principal</span>
                    </label>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={hero.showBanner}
                        onChange={(e) => setHero({ ...hero, showBanner: e.target.checked })}
                      />
                      Mostrar banner
                    </label>
                    <SingleImageUploader value={hero.image} onChange={(image) => setHero({ ...hero, image })} />
                    <div className="form-grid">
                      <label>
                        Posición X
                        <input type="range" min="0" max="100" value={parseInt(hero.imagePosX, 10)} onChange={(e) => setHero({ ...hero, imagePosX: `${e.target.value}%` })} />
                      </label>
                      <label>
                        Posición Y
                        <input type="range" min="0" max="100" value={parseInt(hero.imagePosY, 10)} onChange={(e) => setHero({ ...hero, imagePosY: `${e.target.value}%` })} />
                      </label>
                      <label>
                        Zoom banner
                        <input type="range" min="1" max="1.6" step="0.05" value={hero.imageScale} onChange={(e) => setHero({ ...hero, imageScale: Number(e.target.value) })} />
                      </label>
                    </div>
                  </div>
                  <input placeholder="Título Quiénes" value={about.title} onChange={(e) => setAbout({ ...about, title: e.target.value })} />
                  <textarea placeholder="Texto Quiénes" value={about.text} onChange={(e) => setAbout({ ...about, text: e.target.value })} />
                  <div>
                    <label className="check">
                      <span>Fotos Quiénes</span>
                    </label>
                    <ImageUploader value={about.images || []} onChange={(images) => setAbout({ ...about, images })} />
                  </div>
                  <button className="primary" onClick={saveSettings}>Guardar textos</button>
                </div>

                <div className="admin-section">
                  <h4>Diseño</h4>
                  <div className="form-grid">
                    <label>
                      Color fondo
                      <input type="color" value={theme.bg} onChange={(e) => setTheme({ ...theme, bg: e.target.value })} />
                    </label>
                    <label>
                      Fondo suave
                      <input type="color" value={theme.bgSoft} onChange={(e) => setTheme({ ...theme, bgSoft: e.target.value })} />
                    </label>
                    <label>
                      Texto principal
                      <input type="color" value={theme.ink} onChange={(e) => setTheme({ ...theme, ink: e.target.value })} />
                    </label>
                    <label>
                      Texto secundario
                      <input type="color" value={theme.muted} onChange={(e) => setTheme({ ...theme, muted: e.target.value })} />
                    </label>
                    <label>
                      Color acento
                      <input type="color" value={theme.accent} onChange={(e) => setTheme({ ...theme, accent: e.target.value })} />
                    </label>
                    <label>
                      Acento oscuro
                      <input type="color" value={theme.accentDark} onChange={(e) => setTheme({ ...theme, accentDark: e.target.value })} />
                    </label>
                    <label>
                      Tarjetas
                      <input type="color" value={theme.card} onChange={(e) => setTheme({ ...theme, card: e.target.value })} />
                    </label>
                    <label>
                      Radio bordes
                      <input type="text" value={theme.radius} onChange={(e) => setTheme({ ...theme, radius: e.target.value })} placeholder="22px" />
                    </label>
                    <label>
                      Sombra
                      <input type="text" value={theme.shadow} onChange={(e) => setTheme({ ...theme, shadow: e.target.value })} placeholder="0 12px 30px rgba(0,0,0,0.12)" />
                    </label>
                  </div>
                  <div className="form-grid">
                    <label>
                      Tipografía títulos
                      <select value={theme.headingFont} onChange={(e) => setTheme({ ...theme, headingFont: e.target.value })}>
                        <option value={'"Playfair Display", serif'}>Playfair Display</option>
                        <option value={'"DM Serif Display", serif'}>DM Serif Display</option>
                      </select>
                    </label>
                    <label>
                      Tipografía texto
                      <select value={theme.bodyFont} onChange={(e) => setTheme({ ...theme, bodyFont: e.target.value })}>
                        <option value={'"Manrope", sans-serif'}>Manrope</option>
                        <option value={'"Sora", sans-serif'}>Sora</option>
                      </select>
                    </label>
                    <label>
                      Tamaño H1
                      <input type="text" value={theme.h1Size} onChange={(e) => setTheme({ ...theme, h1Size: e.target.value })} placeholder="30px" />
                    </label>
                    <label>
                      Tamaño H2
                      <input type="text" value={theme.h2Size} onChange={(e) => setTheme({ ...theme, h2Size: e.target.value })} placeholder="26px" />
                    </label>
                    <label>
                      Tamaño texto
                      <input type="text" value={theme.bodySize} onChange={(e) => setTheme({ ...theme, bodySize: e.target.value })} placeholder="16px" />
                    </label>
                    <label>
                      Tamaño botones
                      <input type="text" value={theme.buttonSize} onChange={(e) => setTheme({ ...theme, buttonSize: e.target.value })} placeholder="14px" />
                    </label>
                  </div>
                  <div>
                    <label className="check">
                      <span>Fondo global</span>
                    </label>
                    <SingleImageUploader value={theme.bgImage} onChange={(bgImage) => setTheme({ ...theme, bgImage })} />
                    <div className="form-grid">
                      <label>
                        Fondo X
                        <input type="range" min="0" max="100" value={parseInt(theme.bgPosX, 10)} onChange={(e) => setTheme({ ...theme, bgPosX: `${e.target.value}%` })} />
                      </label>
                      <label>
                        Fondo Y
                        <input type="range" min="0" max="100" value={parseInt(theme.bgPosY, 10)} onChange={(e) => setTheme({ ...theme, bgPosY: `${e.target.value}%` })} />
                      </label>
                      <label>
                        Zoom fondo
                        <input type="range" min="50" max="160" value={parseInt(theme.bgScale, 10)} onChange={(e) => setTheme({ ...theme, bgScale: `${e.target.value}%` })} />
                      </label>
                    </div>
                  </div>
                  <button className="primary" onClick={saveTheme}>Guardar diseño</button>
                </div>

                <div className="admin-section">
                  <h4>PIN de acceso</h4>
                  <div className="inline-form">
                    <input type="password" placeholder="Nuevo PIN" value={adminPinNew} onChange={(e) => setAdminPinNew(e.target.value)} />
                    <button onClick={saveAdminPin}>Actualizar PIN</button>
                  </div>
                </div>

                <div className="admin-section">
                  <h4>Contacto</h4>
                  <div className="form-grid">
                    <input placeholder="Instagram" value={contact.instagram} onChange={(e) => setContact({ ...contact, instagram: e.target.value })} />
                    <input placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                    <input placeholder="Teléfono" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
                    <input placeholder="Ubicación" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
                  </div>
                  <button className="primary" onClick={saveContact}>Guardar contacto</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default App;
