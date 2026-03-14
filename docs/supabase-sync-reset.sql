begin;

-- The current live tables are empty but do not match the application schema.
-- Reset them to the shape LekkerLedger actually uses in code.

drop table if exists public.synced_files cascade;
drop table if exists public.synced_records cascade;
drop table if exists public.user_profiles cascade;

create table public.user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    key_setup_complete boolean not null default false,
    validation_payload jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table public.synced_records (
    user_id uuid not null references auth.users(id) on delete cascade,
    table_name text not null,
    record_id text not null,
    encrypted_data jsonb not null,
    updated_at timestamptz not null default timezone('utc', now()),
    primary key (user_id, table_name, record_id)
);

create table public.synced_files (
    user_id uuid not null references auth.users(id) on delete cascade,
    file_id text not null,
    mime_type text,
    iv text not null,
    size bigint,
    updated_at timestamptz not null default timezone('utc', now()),
    primary key (user_id, file_id)
);

create index if not exists idx_synced_records_user_id on public.synced_records(user_id);
create index if not exists idx_synced_files_user_id on public.synced_files(user_id);

alter table public.user_profiles enable row level security;
alter table public.synced_records enable row level security;
alter table public.synced_files enable row level security;

create policy "user_profiles_self_access"
on public.user_profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "synced_records_self_access"
on public.synced_records
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "synced_files_self_access"
on public.synced_files
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.synced_records;
alter publication supabase_realtime add table public.synced_files;

commit;
