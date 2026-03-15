# Supabase Sync Schema

If your live Supabase project already has `user_profiles`, `synced_records`, and `synced_files` with real data, run [supabase-sync-migrate-recoverable.sql](./supabase-sync-migrate-recoverable.sql) first. If those tables are still empty and you want a clean reset, run [supabase-sync-reset.sql](./supabase-sync-reset.sql) instead.

LekkerLedger's encrypted sync now depends on four Supabase tables:

## `public.user_profiles`

Stores the selected encryption mode, unlock validation payload, and user-side wrapped key metadata.

```sql
create table if not exists public.user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    encryption_mode text not null default 'maximum_privacy',
    mode_version integer not null default 1,
    key_setup_complete boolean not null default false,
    validation_payload jsonb,
    wrapped_master_key_user jsonb,
    user_wrap_salt text,
    user_wrap_kdf text,
    recent_recovery_notice_at timestamptz,
    recent_recovery_event_kind text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);
```

## `public.account_key_recovery`

Stores the server-wrapped copy of the recoverable account master key. This table is only used for Recoverable Encryption.

```sql
create table if not exists public.account_key_recovery (
    user_id uuid primary key references auth.users(id) on delete cascade,
    wrapped_master_key_server jsonb not null,
    recovery_version integer not null default 1,
    last_recovered_at timestamptz,
    last_recovery_reason text,
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
alter table public.account_key_recovery enable row level security;
alter table public.synced_records enable row level security;
alter table public.synced_files enable row level security;
```

Example policies:

```sql
create policy "user_profiles_self_access" on public.user_profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "account_key_recovery_self_access" on public.account_key_recovery
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

## Required Server Secret

Recoverable Encryption also requires one server-side environment variable:

```text
RECOVERABLE_WRAP_SECRET=<long random secret>
```

The app uses this secret to wrap the recoverable account master key before it is stored in `account_key_recovery`. Keep it only in your deployment environment, not in client-side variables.
