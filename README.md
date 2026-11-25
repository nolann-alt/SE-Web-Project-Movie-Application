# FilmSphere - Movie Application

Student project for the Software Engineering course: a website to browse, search and sort movies, built with React (Vite), Tailwind CSS and the TMDB API.

## Run the project

```bash
npm install
cp .env.example .env
npm run dev
```

## Supabase setup

1. Create a Supabase project and enable email/password authentication.
2. In the project's Auth settings, require passwords to be at least 12 characters and include uppercase and lowercase letters, a number, and a symbol. The app checks these rules before signup too, but only Supabase can enforce the policy against direct API requests.
3. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor. Re-run it if you already ran an earlier version; it now also sets up unique usernames.
4. In Supabase URL Configuration, allow your local URL (`http://localhost:5173`) and deployed app URL.
5. Add the project URL and publishable/anon key to `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

The review table is shared between users. Row Level Security lets everyone read reviews and restricts insert, update, and delete to the signed-in owner. Usernames are unique regardless of capitalization; they can be chosen at sign-up or changed from the profile menu. Never put a Supabase service-role key in the frontend.

## TMDB API key

Get a free key at [themoviedb.org](https://www.themoviedb.org/) (Settings > API) and set `VITE_TMDB_API_KEY` in `.env`.

Never commit your real key. `.env` is ignored by Git.

This product uses the TMDB API but is not endorsed or certified by TMDB.

Existing accounts and reviews saved in browser storage are not migrated to Supabase. Users need to create accounts in the configured Supabase project.

## AI use

Parts of this project were written with the help of AI.