import { Link } from "react-router";
import { MIN_PASSWORD_LENGTH } from "../utils/passwordPolicy";

export default function AuthForm({
  isLogin,
  username,
  email,
  password,
  error,
  message,
  isSubmitting,
  onEmailChange,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4 text-white">
      <section className="w-full max-w-md rounded-2xl bg-slate-800 p-8 shadow-xl">
        <Link to="/" className="text-sm text-sky-400 hover:text-sky-300">
          &larr; Back to FilmSphere
        </Link>

        <h1 className="mt-6 text-3xl font-bold">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-slate-300">
          {isLogin
            ? "Log in to access your FilmSphere account."
            : "Create an account to save your movies and preferences."}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          {!isLogin && (
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                required
                minLength="3"
                maxLength="20"
                pattern="[A-Za-z0-9_]{3,20}"
                title="Use 3 to 20 letters, numbers, or underscores."
                autoComplete="nickname"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400"
              />
              <p className="mt-1 text-xs text-slate-400">
                3–20 letters, numbers, or underscores. Usernames are unique.
              </p>
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              required
              autoComplete={isLogin ? "email" : "username"}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              required
              minLength={isLogin ? undefined : MIN_PASSWORD_LENGTH}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400"
            />
            {!isLogin && (
              <p className="mt-1 text-xs text-slate-400">
                Use at least {MIN_PASSWORD_LENGTH} characters, including uppercase and lowercase letters, a number, and a symbol.
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-950 p-3 text-sm text-red-200">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="rounded-lg bg-sky-950 p-3 text-sm text-sky-200">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            {isSubmitting ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <Link
            to={isLogin ? "/register" : "/login"}
            className="font-semibold text-sky-400 hover:text-sky-300"
          >
            {isLogin ? "Sign up" : "Log in"}
          </Link>
        </p>
      </section>
    </main>
  );
}
