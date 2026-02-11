-- Run in Supabase SQL editor
create table if not exists categories (
  id uuid primary key,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists workshops (
  id uuid primary key,
  title text not null,
  description text not null,
  price integer not null,
  date text,
  location text not null,
  category_id uuid,
  images jsonb default '[]'::jsonb,
  map_embed text,
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sessions (
  id uuid primary key,
  workshop_id uuid not null references workshops(id) on delete cascade,
  date text not null,
  time text default '10:00',
  location text default '',
  seats integer not null,
  created_at timestamptz default now()
);

create table if not exists brands (
  id uuid primary key,
  name text not null,
  logo_url text not null,
  created_at timestamptz default now()
);

create table if not exists reservations (
  id uuid primary key,
  workshop_id uuid not null references workshops(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  name text not null,
  email text not null,
  seats integer not null,
  reservation_date text not null,
  status text not null,
  created_at timestamptz default now()
);

create table if not exists settings (
  key text primary key,
  value text not null
);

-- RLS (optional) - enable and then add policies if needed
-- alter table categories enable row level security;
-- alter table workshops enable row level security;
-- alter table sessions enable row level security;
-- alter table brands enable row level security;
-- alter table reservations enable row level security;
-- alter table settings enable row level security;
