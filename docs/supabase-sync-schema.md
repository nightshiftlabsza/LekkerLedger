# Supabase Sync Schema

If your live Supabase project already has `user_profiles`, `synced_records`, and `synced_files` but with different column names, do not try to patch the app around that older schema. If those tables are still empty, run [supabase-sync-reset.sql](/C:/Users/mzaka.ZAK-PC/Documents/Apps/LekkerLedger-1/docs/supabase-sync-reset.sql) to reset them to the schema the app code expects.

LekkerLedger's encrypted sync depends on three Supabase tables:

## `public.user_profiles`

Stores recovery-key setup state and the encrypted validation payload used to verify the key on each new device.

```sql
create table if not exists public.user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    key_setup_complete boolean not null default false,
    validation_payload jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);
```

## `public.synced_records`

Stores encrypted JSON records for structured app data.

```sql
create table if not exists public.synced_records (
    user_id uuid not null references auth.users(id) on delete cascade,
    table_name text not null,
    record_id text not null,
    encrypted_data jsonb not null,
    updated_at timestamptz not null default timezone('utc', now()),
    primary key (user_id, table_name, record_id)
);
```

## `public.synced_files`

Stores encrypted file metadata. The encrypted binary itself lives in Cloudflare R2 under the object key `<user_id>/<file_id>`.

```sql
create table if not exists public.synced_files (
    user_id uuid not null references auth.users(id) on delete cascade,
    file_id text not null,
    mime_type text,
    iv text not null,
    size bigint,
    updated_at timestamptz not null default timezone('utc', now()),
    primary key (user_id, file_id)
);
```

## Recommended RLS

Each table should use row-level security so an authenticated user can only read and write rows tied to `auth.uid()`.

```sql
alter table public.user_profiles enable row level security;
alter table public.synced_records enable row level security;
alter table public.synced_files enable row level security;
```

Example policies:

```sql
create policy "user_profiles_self_access" on public.user_profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "synced_records_self_access" on public.synced_records
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "synced_files_self_access" on public.synced_files
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Realtime

Encrypted record/file changes are also consumed through Supabase Realtime, so both sync tables should be present in the realtime publication:

```sql
alter publication supabase_realtime add table public.synced_records;
alter publication supabase_realtime add table public.synced_files;
```
