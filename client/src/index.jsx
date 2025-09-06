import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';

import App from './App';
import Join from './Join';
import Room from './Room';
import { SessionProvider } from './SessionContext';

import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img src="../images/Logo.png" height={45} alt="Logo" className="rounded"/> Live Poll Battle
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item mx-1">
              <NavLink to="/" className="nav-link px-3 rounded" style={({ isActive }) => isActive ? { backgroundColor: "#616367ff", color: "#fff" } : {}}>Home</NavLink>
            </li>
            <li className="nav-item mx-1">
              <NavLink to="/join" className="nav-link px-3 rounded" style={({ isActive }) => isActive ? { backgroundColor: "#616367ff", color: "#fff" } : {}}>Join / Create</NavLink>
            </li>
            <li className="nav-item mx-1">
              <NavLink to="/room" className="nav-link px-3 rounded" style={({ isActive }) => isActive ? { backgroundColor: "#616367ff", color: "#fff" } : {}}>Room</NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <SessionProvider>
    <Navbar />
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/join" element={<Join />} />
      <Route path="/room" element={<Room />} />
    </Routes>
    </SessionProvider>
  </BrowserRouter>
);
