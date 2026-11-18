import { useState } from "react";
import profileImage from "../assets/profile.png";

function ProfileButton() {
    const [isOpen, setIsOpen] = useState(false);

    const isConnected = false;

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="border-none bg-transparent cursor-pointer"
                >
                <img src={profileImage} alt="Profil" className="w-14 h-14 object-contain"/>
            </button>

            {!isConnected && isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-50">
                    <a href="/login" className="block px-4 py-3 text-black hover:bg-gray-100">Log in</a>
                    <a href="/register" className="block px-4 py-3 text-black hover:bg-gray-100">Sign up</a>
                </div>
            )}

        </div>
    );
}

export default ProfileButton;