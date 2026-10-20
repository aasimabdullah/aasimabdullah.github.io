-- Run this once in your Supabase project's SQL Editor.
create table if not exists public.biotutor_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  study_data jsonb not null default '{"quizzes":0,"correct":0,"attempted":0,"topics":[],"topicAttempts":{},"history":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.biotutor_user_data enable row level security;

drop policy if exists "Users can read their own BioTutor data" on public.biotutor_user_data;
create policy "Users can read their own BioTutor data"
  on public.biotutor_user_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own BioTutor data" on public.biotutor_user_data;
create policy "Users can create their own BioTutor data"
  on public.biotutor_user_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own BioTutor data" on public.biotutor_user_data;
create policy "Users can update their own BioTutor data"
  on public.biotutor_user_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.biotutor_user_data from public, anon, authenticated;
grant select, insert, update on public.biotutor_user_data to authenticated;
