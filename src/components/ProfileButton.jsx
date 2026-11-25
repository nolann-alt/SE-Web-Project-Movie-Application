import { useEffect, useState } from "react";
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
        onClick={() => setIsOpen(!isOpen)}
        className="group cursor-pointer rounded-full border-none bg-transparent transition-transform duration-300 hover:scale-110"
      >
        <img
          src={profileImage}
          alt="Profile"
          className="h-10 w-10 rounded-full object-cover transition group-hover:ring-2 group-hover:ring-sky-300/80 group-hover:ring-offset-2 group-hover:ring-offset-slate-950"
        />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl shadow-black/30">
          {error && <p role="alert" className="px-2 py-2 text-center text-xs text-red-300">{error}</p>}
          {currentUser ? (
            <>
              <p className="truncate border-b border-slate-800 px-2 pb-2 text-center text-xs text-slate-400">
                {username || currentUser}
              </p>
              <form onSubmit={handleUsernameUpdate} className="space-y-2 py-2">
                <label htmlFor="profile-username" className="block text-xs text-slate-400">
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-sm text-white outline-none focus:border-sky-400"
                />
                {usernameError && <p role="alert" className="text-xs text-red-300">{usernameError}</p>}
                {usernameMessage && <p role="status" className="text-xs text-emerald-300">{usernameMessage}</p>}
                <button
                  type="submit"
                  disabled={isSavingUsername || !currentUserId}
                  className="w-full rounded-lg bg-sky-500 px-2 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSavingUsername ? "Saving..." : "Save username"}
                </button>
              </form>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full border-t border-slate-800 px-2 pt-2 text-center text-sm text-slate-200 transition hover:text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block px-2 py-2 text-center text-sm text-slate-200 transition hover:bg-slate-800 hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="block border-t border-slate-800 px-2 py-2 text-center text-sm text-slate-200 transition hover:bg-slate-800 hover:text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileButton;
