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
        <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
          {currentUser ? (
            <>
              <p className="truncate px-4 py-3 text-xs text-gray-500">
                {currentUser}
              </p>
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-3 text-left text-black hover:bg-gray-100"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block px-4 py-3 text-black hover:bg-gray-100"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="block px-4 py-3 text-black hover:bg-gray-100"
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
