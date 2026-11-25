import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router";
import profileImage from "../assets/profile.png";
import { getCurrentUser, getCurrentUserId, logoutUser } from "../services/auth";
import { getProfileUsername, updateProfileUsername } from "../services/movieLists";

function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [currentUserId, setCurrentUserId] = useState(getCurrentUserId());
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function updateCurrentUser() {
      setCurrentUser(getCurrentUser());
      setCurrentUserId(getCurrentUserId());
      setUsernameError("");
      setUsernameMessage("");
    }
    window.addEventListener("filmsphere-auth-updated", updateCurrentUser);
    return () => window.removeEventListener("filmsphere-auth-updated", updateCurrentUser);
  }, []);

  useEffect(() => {
    let isActive = true;
    if (!currentUserId) {
      setUsername("");
      return () => {
        isActive = false;
      };
    }

    getProfileUsername(currentUserId)
      .then((profileUsername) => {
        if (isActive) {
          setUsername(profileUsername);
          setUsernameError("");
        }
      })
      .catch(() => {
        if (isActive) setUsernameError("Unable to load your username.");
      });
    return () => {
      isActive = false;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function handleLogout() {
    const result = await logoutUser();
    if (!result.success) {
      setError(result.error);
      return;
    }
    setIsOpen(false);
    navigate("/");
  }

  async function handleUsernameUpdate(event) {
    event.preventDefault();
    if (!currentUserId) return;
    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      setUsernameError("Use 3 to 20 letters, numbers, or underscores.");
      return;
    }

    setUsernameError("");
    setUsernameMessage("");
    setIsSavingUsername(true);
    try {
      const savedUsername = await updateProfileUsername(currentUserId, normalizedUsername);
      setUsername(savedUsername);
      setUsernameMessage("Username updated.");
      window.dispatchEvent(new Event("filmsphere-profile-updated"));
    } catch (updateError) {
      const errorCode = updateError?.code;
      const errorMessage = updateError?.message || "";
      if (errorCode === "23505" || errorMessage.includes("profiles_username_lower_uidx")) {
        setUsernameError("That username is already taken.");
      } else if (["42501", "PGRST116", "42P01"].includes(errorCode)) {
        setUsernameError("Supabase rejected the update. Run the latest supabase/schema.sql in the SQL Editor, then try again.");
      } else {
        setUsernameError(errorMessage || "Unable to update your username. Please try again.");
      }
    } finally {
      setIsSavingUsername(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open profile menu"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="group cursor-pointer rounded-full border-none bg-transparent transition-transform duration-300 hover:scale-110"
      >
        <img
          src={profileImage}
          alt="Profile"
          className="h-10 w-10 rounded-full object-cover transition group-hover:ring-2 group-hover:ring-sky-300/80 group-hover:ring-offset-2 group-hover:ring-offset-slate-950"
        />
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close profile dialog"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-dialog-title"
            className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/50"
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 id="profile-dialog-title" className="text-lg font-bold text-white">
                {currentUser ? "Your Profile" : "Your Account"}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close profile dialog"
                className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>
            {error && <p role="alert" className="mb-3 text-center text-sm text-red-300">{error}</p>}
            {currentUser ? (
              <>
                <p className="truncate border-b border-slate-800 px-2 pb-3 text-center text-sm text-slate-400">
                  {username || currentUser}
                </p>
                <form onSubmit={handleUsernameUpdate} className="space-y-3 py-4">
                  <label htmlFor="profile-username" className="block text-sm text-slate-300">
                    Change username
                  </label>
                  <input
                    id="profile-username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    minLength="3"
                    maxLength="20"
                    pattern="[A-Za-z0-9_]{3,20}"
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                  />
                  {usernameError && <p role="alert" className="text-sm text-red-300">{usernameError}</p>}
                  {usernameMessage && <p role="status" className="text-sm text-emerald-300">{usernameMessage}</p>}
                  <button
                    type="submit"
                    disabled={isSavingUsername || !currentUserId}
                    className="w-full rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60"
                  >
                    {isSavingUsername ? "Saving..." : "Save username"}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full border-t border-slate-800 pt-3 text-center text-sm text-slate-200 transition hover:text-white"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-center text-sm text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg border-t border-slate-800 px-3 py-2.5 text-center text-sm text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  Sign up
                </Link>
              </div>
            )}
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default ProfileButton;
