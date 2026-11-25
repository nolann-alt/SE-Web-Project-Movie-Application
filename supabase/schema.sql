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

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,40}$'),
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists "Anyone can read usernames" on public.profiles;
create policy "Anyone can read usernames"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own username" on public.profiles;
create policy "Users can update their own username"
  on public.profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username := lower(btrim(new.raw_user_meta_data ->> 'username'));

  if requested_username is null or requested_username = '' then
    requested_username := 'user_' || replace(new.id::text, '-', '');
  end if;

  if requested_username !~ '^[A-Za-z0-9_]{3,40}$' then
    raise exception 'Username must be 3 to 40 letters, numbers, or underscores.';
  end if;

  if exists (
    select 1
    from public.profiles
    where lower(username) = requested_username
  ) then
    raise exception 'Username is already taken.';
  end if;

  insert into public.profiles (user_id, username)
  values (new.id, requested_username);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_movie_review_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.movie_reviews
  set author = new.username
  where user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists sync_movie_review_author on public.profiles;
create trigger sync_movie_review_author
  after update of username on public.profiles
  for each row execute function public.sync_movie_review_author();

insert into public.profiles (user_id, username)
select id, 'user_' || replace(id::text, '-', '')
from auth.users
on conflict (user_id) do nothing;

update public.movie_reviews as reviews
set author = profiles.username
from public.profiles as profiles
where profiles.user_id = reviews.user_id
  and reviews.author is distinct from profiles.username;

alter table public.movie_reviews enable row level security;

drop policy if exists "Anyone can read movie reviews" on public.movie_reviews;
create policy "Anyone can read movie reviews"
  on public.movie_reviews for select
  using (true);

drop policy if exists "Users can add their own movie reviews" on public.movie_reviews;
create policy "Users can add their own movie reviews"
  on public.movie_reviews for insert to authenticated
  with check (
    auth.uid() = user_id
    and author = (
      select profiles.username
      from public.profiles
      where profiles.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own movie reviews" on public.movie_reviews;
create policy "Users can update their own movie reviews"
  on public.movie_reviews for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and author = (
      select profiles.username
      from public.profiles
      where profiles.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their own movie reviews" on public.movie_reviews;
create policy "Users can delete their own movie reviews"
  on public.movie_reviews for delete to authenticated
  using (auth.uid() = user_id);

grant select on public.movie_reviews to anon, authenticated;
grant insert, update, delete on public.movie_reviews to authenticated;

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
