-- ============================================================
--  CP AXTRA / CJ Logistics — Security Command Center
--  Supabase (PostgreSQL) schema — run this in Supabase SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ── Users ──────────────────────────────────────────────
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  role text not null default 'admin',
  display_name text,
  created_at timestamptz default now()
);

-- ── Rate configuration (replaces Config_Rates sheet) ────
create table if not exists config_rates (
  id uuid primary key default gen_random_uuid(),
  position_type text unique not null,        -- 'หัวหน้าชุด' | 'Security Guard'
  day_rate numeric not null default 0,
  night_rate numeric not null default 0,
  note text,
  updated_at timestamptz default now(),
  updated_by text
);

-- ── Shift reports (one row per submitted shift, replaces the "ยอดรวม" summary row) ──
create table if not exists shift_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  site text not null,
  shift text not null,                       -- 'กลางวัน' | 'กลางคืน'
  reporter_name text,
  reporter_phone text,
  meeting_topics text,
  external_link text,
  signature_url text,
  meeting_urls text[] default '{}',
  total_present int default 0,
  total_absent int default 0,
  total_billable numeric default 0,
  total_deduct numeric default 0,
  created_at timestamptz default now(),
  unique (report_date, site, shift)          -- enforces "no duplicate submission"
);

-- ── Individual guard entries (replaces each data row in the site sheets) ──
create table if not exists shift_entries (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references shift_reports(id) on delete cascade,
  report_date date not null,
  site text not null,
  shift text not null,
  position text not null,
  guard_name text,
  employee_id text,
  pos_type text not null,                    -- 'หัวหน้าชุด' | 'Security Guard'
  rate numeric default 0,
  earned numeric default 0,
  status text not null,                      -- 'มา' | 'ขาดจุด' | 'ทิ้งจุด' | 'ลาป่วย' | 'ลากิจ'
  created_at timestamptz default now()
);

create index if not exists idx_shift_entries_date on shift_entries(report_date);
create index if not exists idx_shift_entries_site on shift_entries(site);
create index if not exists idx_shift_entries_status on shift_entries(status);
create index if not exists idx_shift_entries_name on shift_entries(guard_name);

-- ── Error log (replaces Error_Log sheet) ────────────────
create table if not exists error_log (
  id uuid primary key default gen_random_uuid(),
  function_name text,
  error_message text,
  payload jsonb,
  user_ref text,
  created_at timestamptz default now()
);

-- ── Seed defaults (same as initSheets() in the old Code.gs) ──
insert into config_rates (position_type, day_rate, night_rate, note, updated_by)
values
  ('หัวหน้าชุด', 700, 750, 'Command Officer', 'System'),
  ('Security Guard', 600, 650, 'รปภ. ประจำจุดทั่วไป', 'System')
on conflict (position_type) do nothing;

-- Default admin login — CHANGE THE PASSWORD after first login!
-- username: admin / password: 123456  (bcrypt hash generated with bcryptjs)
insert into users (username, password_hash, role, display_name)
values ('admin', '$2b$10$SLp4SV5YqbxxMIc3IlW6.OaQnmo2Pv5oWXC6OdcdFrvAHsxv/K2UC', 'admin', 'Sup. Chayakorn')
on conflict (username) do nothing;
