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
                className="border-none bg-transparent cursor-pointer"
                >
                <img src={profileImage} alt="Profil" className="w-14 h-14 object-contain"/>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-50">
                    {currentUser ? (
                        <>
                            <p className="truncate px-4 py-3 text-xs text-gray-500">{currentUser}</p>
                            <button onClick={handleLogout} className="block w-full px-4 py-3 text-left text-black hover:bg-gray-100">Log out</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="block px-4 py-3 text-black hover:bg-gray-100">Log in</Link>
                            <Link to="/register" className="block px-4 py-3 text-black hover:bg-gray-100">Sign up</Link>
                        </>
                    )}
                </div>
            )}

        </div>
    );
}

export default ProfileButton;