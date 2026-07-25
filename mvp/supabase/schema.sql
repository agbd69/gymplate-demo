create extension if not exists "pgcrypto";

create table if not exists public.food_catalog (
  id text primary key,
  name text not null,
  calories numeric(7, 1) not null default 0,
  protein numeric(7, 1) not null default 0,
  carbs numeric(7, 1) not null default 0,
  fat numeric(7, 1) not null default 0,
  unit text not null default '每100g',
  category text,
  source text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.exercise_catalog (
  id text primary key,
  name text not null,
  muscle_group text not null,
  equipment text,
  guide text,
  steps jsonb not null default '[]'::jsonb,
  default_sets jsonb not null default '[]'::jsonb,
  gif_url text,
  thumbnail_url text,
  source text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  sex text check (sex in ('male', 'female')),
  age integer check (age between 10 and 100),
  height_cm numeric(5, 1) check (height_cm between 80 and 230),
  weight_kg numeric(5, 1) check (weight_kg between 25 and 250),
  goal text not null default 'cut' check (goal in ('cut', 'maintain', 'bulk')),
  training_days integer not null default 4 check (training_days between 1 and 7),
  target_weight_kg numeric(5, 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null,
  weight_kg numeric(5, 1),
  steps integer check (steps >= 0),
  sleep_hours numeric(4, 1) check (sleep_hours between 0 and 24),
  mood text,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, record_date)
);

create table if not exists public.meal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  name text not null,
  is_default boolean not null default false,
  source text not null default 'user' check (source in ('user', 'ai', 'seed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_record_id uuid references public.daily_records(id) on delete cascade,
  template_id uuid references public.meal_templates(id) on delete cascade,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text not null,
  grams numeric(7, 1),
  calories integer not null default 0,
  protein numeric(7, 1) not null default 0,
  carbs numeric(7, 1) not null default 0,
  fat numeric(7, 1) not null default 0,
  source text not null default 'food-db' check (source in ('food-db', 'ai-estimate', 'user-template', 'manual')),
  macro_edited boolean not null default false,
  created_by text not null default 'manual' check (created_by in ('manual', 'template', 'ai-draft', 'migrated')),
  created_at timestamptz not null default now(),
  constraint meal_entry_parent check (
    (daily_record_id is not null and template_id is null)
    or (daily_record_id is null and template_id is not null)
  )
);

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal text not null check (goal in ('cut', 'maintain', 'bulk')),
  days_per_week integer not null check (days_per_week between 1 and 7),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_record_id uuid references public.daily_records(id) on delete cascade,
  plan_id uuid references public.training_plans(id) on delete set null,
  name text not null,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.training_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  muscle_group text not null,
  set_index integer not null check (set_index > 0),
  weight_kg numeric(7, 2) not null default 0,
  reps integer not null default 0 check (reps >= 0),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.food_catalog enable row level security;
alter table public.exercise_catalog enable row level security;
alter table public.daily_records enable row level security;
alter table public.meal_templates enable row level security;
alter table public.meal_entries enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_sets enable row level security;

create policy "profiles are owned by user" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "food catalog is readable" on public.food_catalog
  for select using (true);

create policy "exercise catalog is readable" on public.exercise_catalog
  for select using (true);

create policy "daily records are owned by user" on public.daily_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meal templates are owned by user" on public.meal_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meal entries are owned by user" on public.meal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "training plans are owned by user" on public.training_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "training sessions are owned by user" on public.training_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "training sets are owned by user" on public.training_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists daily_records_user_date_idx on public.daily_records(user_id, record_date desc);
create index if not exists food_catalog_name_idx on public.food_catalog using gin (to_tsvector('simple', name));
create index if not exists exercise_catalog_muscle_idx on public.exercise_catalog(muscle_group);
create index if not exists meal_entries_daily_record_idx on public.meal_entries(daily_record_id);
create index if not exists meal_entries_template_idx on public.meal_entries(template_id);
create index if not exists training_sessions_daily_record_idx on public.training_sessions(daily_record_id);
create index if not exists training_sets_session_idx on public.training_sets(session_id, set_index);
