import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router";
import "./index.css";
import App from "./App.jsx";
import LogIn from "./pages/LogIn.jsx";
import Register from "./pages/Register.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import WatchList from "./pages/WatchList.jsx";
import Favorites from "./pages/Favorites.jsx";
import { AuthProvider } from "./services/auth.js";

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="/movie/:movieId" element={<MovieDetails />} />
        <Route path="/watchlist" element={<WatchList />} />
        <Route path="/favorites" element={<Favorites />} />
      </Routes>
    </HashRouter>
  </AuthProvider>,
);
