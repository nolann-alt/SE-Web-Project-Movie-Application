import { useState } from "react";
import { Link, useNavigate } from "react-router";
import profileImage from "../assets/profile.png";
import { getCurrentUser, logoutUser } from "../services/auth";

function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  function handleLogout() {
    logoutUser();
    setIsOpen(false);
    navigate("/");
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer border-none bg-transparent"
      >
        <img
          src={profileImage}
          alt="Profile"
          className="h-14 w-14 object-contain"
        />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 top-full z-50 mt-3 w-36 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/30">
          {currentUser ? (
            <>
              <p className="truncate border-b border-slate-800 px-2 py-2 text-center text-xs text-slate-400">
                {currentUser}
              </p>
              <button
                onClick={handleLogout}
                className="block w-full px-2 py-2 text-center text-sm text-slate-200 transition hover:bg-slate-800 hover:text-white"
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
