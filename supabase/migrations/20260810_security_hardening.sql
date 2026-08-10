-- Security/performance hardening for the beta schema.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop policy if exists "profiles are private" on public.profiles;
create policy "profiles are private" on public.profiles for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "progress is private" on public.progress;
create policy "progress is private" on public.progress for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "memories are private" on public.memories;
create policy "memories are private" on public.memories for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "signed-in users can send feedback" on public.feedback;
create policy "signed-in users can send feedback" on public.feedback for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "users can read their own feedback" on public.feedback;
create policy "users can read their own feedback" on public.feedback for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "progress v3 is private" on public.progress_v3;
create policy "progress v3 is private" on public.progress_v3 for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index if not exists feedback_user_id_idx on public.feedback(user_id);
