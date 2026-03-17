begin;

alter table public.user_profiles
    add column if not exists encryption_mode text,
    add column if not exists mode_version integer,
    add column if not exists wrapped_master_key_user jsonb,
    add column if not exists user_wrap_salt text,
    add column if not exists user_wrap_kdf text,
    add column if not exists recent_recovery_notice_at timestamptz,
    add column if not exists recent_recovery_event_kind text,
    add column if not exists created_at timestamptz not null default timezone('utc', now()),
    add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.user_profiles
set
    encryption_mode = coalesce(encryption_mode, 'maximum_privacy'),
    mode_version = coalesce(mode_version, 1),
    updated_at = timezone('utc', now())
where encryption_mode is null
   or mode_version is null;

alter table public.user_profiles
    alter column encryption_mode set default 'maximum_privacy',
    alter column encryption_mode set not null,
    alter column mode_version set default 1,
    alter column mode_version set not null;

create table if not exists public.account_key_recovery (
    user_id uuid primary key references auth.users(id) on delete cascade,
    wrapped_master_key_server jsonb not null,
    recovery_version integer not null default 1,
    last_recovered_at timestamptz,
    last_recovery_reason text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_profiles enable row level security;
alter table public.account_key_recovery enable row level security;
alter table public.synced_records enable row level security;
alter table public.synced_files enable row level security;

do $$
declare
    target_schema constant text := 'public';
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = target_schema
          and tablename = 'user_profiles'
          and policyname = 'user_profiles_self_access'
    ) then
        create policy "user_profiles_self_access"
        on public.user_profiles
        for all
        using (auth.uid() = id)
        with check (auth.uid() = id);
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = target_schema
          and tablename = 'account_key_recovery'
          and policyname = 'account_key_recovery_self_access'
    ) then
        create policy "account_key_recovery_self_access"
        on public.account_key_recovery
        for all
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = target_schema
          and tablename = 'synced_records'
          and policyname = 'synced_records_self_access'
    ) then
        create policy "synced_records_self_access"
        on public.synced_records
        for all
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = target_schema
          and tablename = 'synced_files'
          and policyname = 'synced_files_self_access'
    ) then
        create policy "synced_files_self_access"
        on public.synced_files
        for all
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);
    end if;
end
$$;

do $$
begin
    alter publication supabase_realtime add table public.synced_records;
exception
    when duplicate_object then null;
end
$$;

do $$
begin
    alter publication supabase_realtime add table public.synced_files;
exception
    when duplicate_object then null;
end
$$;

commit;
