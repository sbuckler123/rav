-- ============================================================
-- Rav App — Supabase Schema
-- Run this entire file in the Supabase SQL Editor (one paste).
-- ============================================================

-- ─── CATEGORIES ─────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  airtable_id text unique,           -- kept for migration mapping, drop after import
  name        text not null,
  status      text not null default 'פעיל',
  tables      text[] default '{}',
  created_at  timestamptz default now()
);

-- ─── USERS ──────────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  airtable_id text unique,
  name        text not null,
  email       text not null unique,
  role        text not null default 'צוות',
  status      text not null default 'פעיל',
  clerk_id    text unique,
  created_at  timestamptz default now()
);

-- ─── ARTICLES ───────────────────────────────────────────────
create table if not exists articles (
  id           uuid primary key default gen_random_uuid(),
  airtable_id  text unique,
  link_id      text unique,
  title        text not null,
  abstract     text,
  full_content text,
  pdf_url      text,
  key_points   text,
  sources      text,
  read_time    text,
  year_hebrew  text,
  year_num     integer,
  journal      text,
  yeshiva      text,
  status       text not null default 'פעיל',
  category_id  uuid references categories(id) on delete set null,
  tags         text[] default '{}',
  created_by   uuid references users(id) on delete set null,
  updated_by   uuid references users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists articles_status_idx  on articles(status);
create index if not exists articles_year_idx    on articles(year_num desc);
create index if not exists articles_link_id_idx on articles(link_id);

-- ─── QUESTIONS ──────────────────────────────────────────────
create table if not exists questions (
  id                  uuid primary key default gen_random_uuid(),
  airtable_id         text unique,
  question_content    text not null,
  asker_name          text,
  asker_email         text,
  status              text not null default 'ממתין',
  consent_to_publish  boolean not null default false,
  approved_to_publish boolean not null default false,
  reference_id        text,
  category_id         uuid references categories(id) on delete set null,
  created_at          timestamptz default now()
);

create index if not exists questions_status_idx  on questions(status);
create index if not exists questions_publish_idx on questions(consent_to_publish, approved_to_publish);

-- ─── ANSWERS ────────────────────────────────────────────────
create table if not exists answers (
  id             uuid primary key default gen_random_uuid(),
  airtable_id    text unique,
  answer_content text not null,
  writer_type    text not null default 'רב',
  question_id    uuid not null references questions(id) on delete cascade,
  created_at     timestamptz default now()
);

create index if not exists answers_question_idx on answers(question_id);

-- ─── EVENTS ─────────────────────────────────────────────────
create table if not exists events (
  id               uuid primary key default gen_random_uuid(),
  airtable_id      text unique,
  link_id          text unique,
  url_id           text,
  title            text not null,
  event_type       text,
  date_hebrew      text,
  date_locale      text,
  location         text,
  excerpt          text,
  description      text,
  full_description text,
  participants     text,
  duration         text,
  quotes           text,
  schedule         text,
  created_by       uuid references users(id) on delete set null,
  updated_by       uuid references users(id) on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists events_date_idx    on events(date_locale desc);
create index if not exists events_link_id_idx on events(link_id);

-- ─── GALLERY ────────────────────────────────────────────────
create table if not exists gallery (
  id          uuid primary key default gen_random_uuid(),
  airtable_id text unique,
  event_id    uuid not null references events(id) on delete cascade,
  image_url   text not null,
  caption     text,
  sort_order  integer not null default 99,
  created_at  timestamptz default now()
);

create index if not exists gallery_event_idx on gallery(event_id);

-- ─── SHIURIM ────────────────────────────────────────────────
create table if not exists shiurim (
  id          uuid primary key default gen_random_uuid(),
  airtable_id text unique,
  link_id     text unique,
  title       text not null,
  date        timestamptz,
  time        text,
  location    text,
  description text,
  category_id uuid references categories(id) on delete set null,
  created_by  uuid references users(id) on delete set null,
  updated_by  uuid references users(id) on delete set null,
  created_at  timestamptz default now()
);

create index if not exists shiurim_date_idx on shiurim(date asc);

-- ─── VIDEOS ─────────────────────────────────────────────────
create table if not exists videos (
  id          uuid primary key default gen_random_uuid(),
  airtable_id text unique,
  link_id     text unique,
  title       text not null,
  date        timestamptz,
  duration    text,
  description text,
  video_type  text default 'youtube',
  youtube_id  text,
  video_url   text,
  thumbnail   text,
  views       integer default 0,
  is_new      boolean default false,
  status      text not null default 'פעיל',
  category_id uuid references categories(id) on delete set null,
  created_by  uuid references users(id) on delete set null,
  updated_by  uuid references users(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists videos_status_idx on videos(status);
create index if not exists videos_date_idx   on videos(date desc);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
-- The server-side API uses the service_role key which bypasses RLS.
-- These policies are for any future direct client access.

alter table categories enable row level security;
alter table users       enable row level security;
alter table articles    enable row level security;
alter table questions   enable row level security;
alter table answers     enable row level security;
alter table events      enable row level security;
alter table gallery     enable row level security;
alter table shiurim     enable row level security;
alter table videos      enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read active articles" on articles for select using (status = 'פעיל');
create policy "public read events"     on events    for select using (true);
create policy "public read gallery"    on gallery   for select using (true);
create policy "public read shiurim"    on shiurim   for select using (true);
create policy "public read active videos" on videos for select using (status = 'פעיל');
create policy "public read published questions" on questions
  for select using (consent_to_publish = true and approved_to_publish = true);
create policy "public read answers"    on answers   for select using (true);
create policy "public submit question" on questions for insert with check (true);
