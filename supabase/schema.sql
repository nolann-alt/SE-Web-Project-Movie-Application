create table if not exists public.movie_reviews (
  id uuid primary key default gen_random_uuid(),
  movie_id bigint not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  author text not null,
  rating smallint not null check (rating between 1 and 10),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (movie_id, user_id)
);

alter table public.movie_reviews enable row level security;

drop policy if exists "Anyone can read movie reviews" on public.movie_reviews;
create policy "Anyone can read movie reviews"
  on public.movie_reviews for select
  using (true);

drop policy if exists "Users can add their own movie reviews" on public.movie_reviews;
create policy "Users can add their own movie reviews"
  on public.movie_reviews for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own movie reviews" on public.movie_reviews;
create policy "Users can update their own movie reviews"
  on public.movie_reviews for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own movie reviews" on public.movie_reviews;
create policy "Users can delete their own movie reviews"
  on public.movie_reviews for delete to authenticated
  using (auth.uid() = user_id);

grant select on public.movie_reviews to anon, authenticated;
grant insert, update, delete on public.movie_reviews to authenticated;
