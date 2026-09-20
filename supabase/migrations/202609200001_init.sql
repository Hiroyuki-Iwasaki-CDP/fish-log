-- Run in the Supabase SQL editor. All user data is isolated by RLS.
create extension if not exists pgcrypto;
create table public.spots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_m integer not null default 300 check (radius_m between 10 and 100000),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, id)
);
create table public.fishing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  spot_id uuid,
  title text not null default '釣行',
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint valid_times check (ended_at is null or ended_at >= started_at),
  constraint session_spot_owner foreign key (user_id, spot_id) references public.spots(user_id, id) on delete set null (spot_id),
  unique (user_id, id)
);
create table public.catches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caught_at timestamptz not null,
  created_at timestamptz not null default now(),
  species text not null default '魚種未入力',
  length_cm numeric(7,1) check (length_cm >= 0),
  weight_g numeric(10,1) check (weight_g >= 0),
  count integer not null default 1 check (count >= 1),
  spot_id uuid,
  session_id uuid,
  note text not null default '',
  photo_path text,
  snapshot jsonb not null default '{}'::jsonb,
  constraint catch_spot_owner foreign key (user_id, spot_id) references public.spots(user_id, id) on delete set null (spot_id),
  constraint catch_session_owner foreign key (user_id, session_id) references public.fishing_sessions(user_id, id) on delete set null (session_id),
  constraint own_photo_path check (photo_path is null or photo_path like user_id::text || '/%')
);
create index catches_user_time on public.catches (user_id, caught_at desc);
create index sessions_user_time on public.fishing_sessions (user_id, started_at desc);
create index spots_user_name on public.spots (user_id, name);
alter table public.spots enable row level security;
alter table public.fishing_sessions enable row level security;
alter table public.catches enable row level security;
create policy "own spots" on public.spots for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own sessions" on public.fishing_sessions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own catches" on public.catches for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catch-photos', 'catch-photos', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "read own photos" on storage.objects for select to authenticated using (bucket_id = 'catch-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "upload own photos" on storage.objects for insert to authenticated with check (bucket_id = 'catch-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "delete own photos" on storage.objects for delete to authenticated using (bucket_id = 'catch-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
