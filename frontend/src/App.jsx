import React, { useEffect, useMemo, useState } from "react";

const API = "http://localhost:4000/api";
const IMG_BASE = "http://localhost:4000";

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
  imageScale: 1
};

const defaultAbout = {
  title: "Somos Artes y Oficios",
  text: "Una comunidad de talleres donde la creatividad se vuelve oficio. Diseñamos experiencias presenciales con materiales premium, guías expertas y un ritmo cercano."
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
  headingFont: "\"Playfair Display\", serif",
  bodyFont: "\"Manrope\", sans-serif",
  h1Size: "30px",
  h2Size: "26px",
  bodySize: "16px",
  buttonSize: "14px",
  bgImage: "http://localhost:4000/uploads/banner-theme.png",
  bgPosX: "50%",
  bgPosY: "0%",
  bgScale: "100%",
  showFrame: true,
  showAngels: true,
  showHearts: true,
  heartsOpacity: "0.5",
  heartsCount: 6
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
    throw new Error(body.error || "Error" );
  }
  return res.json();
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
      // fall through to location-based embed
    }
  }
  if (location) {
    return `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
  }
  return "";
};

const ImageUploader = ({ value = [], onChange }) => {
  const [uploading, setUploading] = useState(false);
  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const newUrls = [];
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetchJSON(`${API}/upload`, { method: "POST", body: form });
      newUrls.push(`${IMG_BASE}${res.url}`);
    }
    onChange([...(value || []), ...newUrls]);
    setUploading(false);
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
            <img src={url} alt="" />
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
    const form = new FormData();
    form.append("file", file);
    const res = await fetchJSON(`${API}/upload`, { method: "POST", body: form });
    onChange(`${IMG_BASE}${res.url}`);
    setUploading(false);
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
          <strong>{uploading ? "Subiendo..." : "Toca para subir banner"}</strong>
          <span>Recomendado 1600x900</span>
        </div>
      </label>
      {value && (
        <div className="thumb">
          <img src={value} alt="" />
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
    const form = new FormData();
    form.append("file", file);
    const res = await fetchJSON(`${API}/upload`, { method: "POST", body: form });
    onChange(`${IMG_BASE}${res.url}`);
    setUploading(false);
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
          <strong>{uploading ? "Subiendo..." : "Subir logo"}</strong>
          <span>PNG o SVG</span>
        </div>
      </label>
      {value && (
        <div className="thumb">
          <img src={value} alt="" />
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
  const [hero, setHero] = useState(defaultHero);
  const [about, setAbout] = useState(defaultAbout);
  const [contact, setContact] = useState(defaultContact);
  const [theme, setTheme] = useState(defaultTheme);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedWorkshop, setSelectedWorkshop] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminPinStored, setAdminPinStored] = useState("");
  const [adminPinNew, setAdminPinNew] = useState("");
  const masterPin = "100202";
  const [companyForm, setCompanyForm] = useState({
    company: "",
    contact: "",
    email: "",
    phone: "",
    attendees: "",
    preferredDate: "",
    message: ""
  });

  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState({ name: "", logo_url: "" });
  const [workshopForm, setWorkshopForm] = useState({
    id: "",
    title: "",
    description: "",
    price: "",
    date: "",
    location: "",
    seats: "",
    category_id: "",
    images: [],
    map_embed: "",
    featured: false
  });

  const filteredWorkshops = useMemo(() => {
    if (activeCategory === "all") return workshops;
    return workshops.filter((w) => w.category_id === activeCategory);
  }, [workshops, activeCategory]);

  const featured = workshops.filter((w) => w.featured).slice(0, 4);

  const loadAll = async () => {
    const [w, c, b, r] = await Promise.all([
      fetchJSON(`${API}/workshops`),
      fetchJSON(`${API}/categories`),
      fetchJSON(`${API}/brands`),
      fetchJSON(`${API}/reservations`)
    ]);
    setWorkshops(w);
    setCategories(c);
    setBrands(b);
    setReservations(r);
  };

  const loadSettings = async () => {
    const heroRes = await fetchJSON(`${API}/settings/hero`).catch(() => ({ value: "" }));
    const aboutRes = await fetchJSON(`${API}/settings/about`).catch(() => ({ value: "" }));
    const pinRes = await fetchJSON(`${API}/settings/admin_pin`).catch(() => ({ value: "" }));
    const themeRes = await fetchJSON(`${API}/settings/theme`).catch(() => ({ value: "" }));
    const contactRes = await fetchJSON(`${API}/settings/contact`).catch(() => ({ value: "" }));
    if (heroRes.value) setHero(JSON.parse(heroRes.value));
    if (aboutRes.value) setAbout(JSON.parse(aboutRes.value));
    if (pinRes.value) {
      setAdminPinStored(pinRes.value);
      setAdminPinNew(pinRes.value);
    }
    if (themeRes.value) setTheme({ ...defaultTheme, ...JSON.parse(themeRes.value) });
    if (contactRes.value) setContact({ ...defaultContact, ...JSON.parse(contactRes.value) });
  };

  useEffect(() => {
    loadAll();
    loadSettings();
  }, []);

  const selectedWorkshopObj = useMemo(
    () => workshops.find((w) => w.id === selectedWorkshop),
    [workshops, selectedWorkshop]
  );

  useEffect(() => {
    if (selectedWorkshopObj?.date) {
      setBookingDate(selectedWorkshopObj.date);
    } else {
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
    root.style.setProperty("--bg-image", theme.bgImage ? `url("${theme.bgImage}")` : "none");
    root.style.setProperty("--bg-pos-x", theme.bgPosX);
    root.style.setProperty("--bg-pos-y", theme.bgPosY);
    root.style.setProperty("--bg-scale", theme.bgScale);
    root.style.setProperty("--hearts-opacity", theme.heartsOpacity);
  }, [theme]);

  const saveWorkshop = async () => {
    const payload = { ...workshopForm };
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
    setWorkshopForm({
      id: "",
      title: "",
      description: "",
      price: "",
      date: "",
      location: "",
      seats: "",
      category_id: "",
      images: [],
      map_embed: "",
      featured: false
    });
    await loadAll();
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetchJSON(`${API}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workshop_id: form.get("workshop"),
        name: form.get("name"),
        email: form.get("email"),
        seats: Number(form.get("seats")),
        reservation_date: form.get("date")
      })
    });
    e.currentTarget.reset();
    await loadAll();
    alert("Reserva registrada. Te contactaremos para confirmar el pago.");
  };

  const adminLogin = () => {
    if (adminPin === masterPin) {
      setAdminAuthed(true);
      return;
    }
    if (!adminPinStored) {
      alert("Primero configura un PIN en el panel.");
      return;
    }
    if (adminPin === adminPinStored) {
      setAdminAuthed(true);
    } else {
      alert("PIN incorrecto");
    }
  };

  const saveSettings = async () => {
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
    alert("Textos actualizados");
  };

  const saveContact = async () => {
    await fetchJSON(`${API}/settings/contact`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(contact) })
    });
    alert("Contacto actualizado");
  };

  const saveTheme = async () => {
    await fetchJSON(`${API}/settings/theme`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(theme) })
    });
    alert("Diseño actualizado");
  };

  const saveAdminPin = async () => {
    if (!adminPinNew) {
      alert("Escribe un PIN");
      return;
    }
    await fetchJSON(`${API}/settings/admin_pin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: adminPinNew })
    });
    setAdminPinStored(adminPinNew);
    setAdminPin("");
    alert("PIN actualizado");
  };

  return (
    <div className="app">
      <div className="ornaments">
        {theme.showFrame && (
          <svg className="frame" viewBox="0 0 390 1200" preserveAspectRatio="none">
            <path
              d="M20 40 Q10 80 20 120 T20 200 T20 300 T20 400 T20 500 T20 600 T20 700 T20 800 T20 900 T20 1000 T20 1100
                 M370 40 Q380 80 370 120 T370 200 T370 300 T370 400 T370 500 T370 600 T370 700 T370 800 T370 900 T370 1000 T370 1100"
            />
          </svg>
        )}
        {theme.showAngels && (
          <svg className="angels" viewBox="0 0 390 150" preserveAspectRatio="none">
            <circle cx="195" cy="60" r="35" />
          </svg>
        )}
        {theme.showHearts && (
          <>
            {Array.from({ length: theme.heartsCount }).map((_, i) => (
              <span
                key={`heart-${i}`}
                className="heart"
                style={{
                  left: `${10 + i * (80 / Math.max(1, theme.heartsCount - 1))}%`,
                  animationDelay: `${(i * 2) % 6}s`
                }}
              />
            ))}
          </>
        )}
      </div>
      <header className="top-bar">
        <div className="logo">
          <span>Artes</span>
          <strong>y Oficios</strong>
        </div>
        <button className="admin-pill" onClick={() => setAdminOpen(true)}>Admin</button>
      </header>

      <section id="inicio" className="hero">
        <img
          src={hero.image}
          alt=""
          style={{
            objectPosition: `${hero.imagePosX} ${hero.imagePosY}`,
            transform: `scale(${hero.imageScale})`
          }}
        />
        <div className="hero-content">
          <p className="eyebrow">Instagram: @artes_oficios_</p>
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
                <img src={w.images?.[0] || hero.image} alt="" />
              </div>
              <div className="work-body">
                <h3>{w.title}</h3>
                <p>{w.description}</p>
                <div className="meta">
                  <span>{currency.format(w.price)}</span>
                  <span>{w.date}</span>
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
                <img src={w.images?.[0] || hero.image} alt="" />
              </div>
              <div className="work-body">
                <div className="work-header">
                  <h3>{w.title}</h3>
                  <span className="badge">{w.category_name || "Taller"}</span>
                </div>
                <p>{w.description}</p>
                <div className="meta-grid">
                  <span>{currency.format(w.price)}</span>
                  <span>{w.date}</span>
                  <span>{w.location}</span>
                  <span>{w.seats} cupos</span>
                </div>
                <div className="card-actions">
                  <a className="secondary" href="#agendar" onClick={() => setSelectedWorkshop(w.id)}>Reservar</a>
                </div>
              </div>
              <div className="map-embed">
                {buildMapSrc(w.map_embed, w.location) ? (
                  <iframe
                    title={`Mapa ${w.title}`}
                    src={buildMapSrc(w.map_embed, w.location)}
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
            Fecha
            <input
              type="date"
              name="date"
              required
              value={bookingDate}
              min={selectedWorkshopObj?.date || undefined}
              max={selectedWorkshopObj?.date || undefined}
              onChange={(e) => setBookingDate(e.target.value)}
            />
          </label>
          <div className="booking-info">
            <div>
              <strong>Ubicación</strong>
              <span>{selectedWorkshopObj?.location || "Selecciona un taller"}</span>
            </div>
            <div>
              <strong>Cupos</strong>
              <span>{selectedWorkshopObj?.seats ? `${selectedWorkshopObj.seats} lugares` : "—"}</span>
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
          <p>Stripe y PayPal listos para México. Conecta tus llaves en el backend para activar pagos reales.</p>
          <div className="pay-buttons">
            <button type="button" className="pay">Pagar con Stripe</button>
            <button type="button" className="pay alt">Pagar con PayPal</button>
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
              <img src={b.logo_url} alt={b.name} />
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
                {!adminPinStored ? (
                  <>
                    <p>Crea tu PIN de acceso.</p>
                    <input type="password" value={adminPinNew} onChange={(e) => setAdminPinNew(e.target.value)} placeholder="Nuevo PIN" />
                    <button className="primary" onClick={saveAdminPin}>Guardar PIN</button>
                  </>
                ) : (
                  <>
                    <p>Ingresa tu PIN.</p>
                    <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="PIN" />
                    <button className="primary" onClick={adminLogin}>Entrar</button>
                  </>
                )}
              </div>
            ) : (
              <div className="admin-body">
                <h3>Administración</h3>
                <div className="admin-section">
                  <h4>Crear/Editar Taller</h4>
                  <div className="form-grid">
                    <input placeholder="Título" value={workshopForm.title} onChange={(e) => setWorkshopForm({ ...workshopForm, title: e.target.value })} />
                    <input placeholder="Precio" type="number" value={workshopForm.price} onChange={(e) => setWorkshopForm({ ...workshopForm, price: e.target.value })} />
                    <input placeholder="Fecha (YYYY-MM-DD)" value={workshopForm.date} onChange={(e) => setWorkshopForm({ ...workshopForm, date: e.target.value })} />
                    <input placeholder="Ubicación" value={workshopForm.location} onChange={(e) => setWorkshopForm({ ...workshopForm, location: e.target.value })} />
                    <input placeholder="Cupos" type="number" value={workshopForm.seats} onChange={(e) => setWorkshopForm({ ...workshopForm, seats: e.target.value })} />
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
                  <button className="primary" onClick={saveWorkshop}>Guardar taller</button>

                  <div className="admin-list">
                    {workshops.map((w) => (
                      <div key={w.id} className="admin-item">
                        <div>
                          <strong>{w.title}</strong>
                          <small>{w.date} · {currency.format(w.price)}</small>
                        </div>
                        <div>
                          <button onClick={() => setWorkshopForm({ ...w, images: w.images || [] })}>Editar</button>
                          <button className="danger" onClick={async () => { await fetchJSON(`${API}/workshops/${w.id}`, { method: "DELETE" }); await loadAll(); }}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-section">
                  <h4>Categorías</h4>
                  <div className="inline-form">
                    <input placeholder="Nueva categoría" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                    <button onClick={async () => { await fetchJSON(`${API}/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCategory }) }); setNewCategory(""); await loadAll(); }}>Agregar</button>
                  </div>
                  <div className="chip-row">
                    {categories.map((c) => (
                      <div className="chip" key={c.id}>
                        <span>{c.name}</span>
                        <button onClick={async () => { await fetchJSON(`${API}/categories/${c.id}`, { method: "DELETE" }); await loadAll(); }}>x</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-section">
                  <h4>Marcas</h4>
                  <div className="inline-form">
                    <input placeholder="Nombre" value={newBrand.name} onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })} />
                    <button onClick={async () => { await fetchJSON(`${API}/brands`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newBrand) }); setNewBrand({ name: "", logo_url: "" }); await loadAll(); }}>Agregar</button>
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
                          <button className="danger" onClick={async () => { await fetchJSON(`${API}/brands/${b.id}`, { method: "DELETE" }); await loadAll(); }}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-section">
                  <h4>Reservas</h4>
                  <div className="admin-list">
                    {reservations.map((r) => (
                      <div key={r.id} className="admin-item">
                        <div>
                          <strong>{r.workshop_title}</strong>
                          <small>{r.name} · {r.seats} lugares · {r.reservation_date}</small>
                        </div>
                        <div className="status">{r.status}</div>
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
                  <div className="form-grid">
                    <label className="check">
                      <input type="checkbox" checked={theme.showFrame} onChange={(e) => setTheme({ ...theme, showFrame: e.target.checked })} />
                      Marco
                    </label>
                    <label className="check">
                      <input type="checkbox" checked={theme.showAngels} onChange={(e) => setTheme({ ...theme, showAngels: e.target.checked })} />
                      Ángeles
                    </label>
                    <label className="check">
                      <input type="checkbox" checked={theme.showHearts} onChange={(e) => setTheme({ ...theme, showHearts: e.target.checked })} />
                      Corazones
                    </label>
                    <label>
                      Intensidad corazones
                      <input type="range" min="0.1" max="0.8" step="0.05" value={theme.heartsOpacity} onChange={(e) => setTheme({ ...theme, heartsOpacity: e.target.value })} />
                    </label>
                    <label>
                      Cantidad corazones
                      <input type="range" min="3" max="10" value={theme.heartsCount} onChange={(e) => setTheme({ ...theme, heartsCount: Number(e.target.value) })} />
                    </label>
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
