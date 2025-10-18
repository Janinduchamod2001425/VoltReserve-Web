import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import Owners from "./pages/Owners.jsx";
import Stations from "./pages/Stations.jsx";
import Bookings from "./pages/Bookings.jsx";
import Navbar from "./components/Navbar.jsx";
import { auth } from "./api";
import MyStations from "./pages/MyStations.jsx";

function Private({ children }) {
  return auth.isAuthed() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Navbar />
      <main className="flex-1 p-6">
        <Routes>
          {/* Home */}
          <Route
            path="/"
            element={
              <Private>
                <Home />
              </Private>
            }
          />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/register"
            element={
              <Private>
                {auth.isBackoffice() ? <Register /> : <div>Forbidden</div>}
              </Private>
            }
          />

          {/* EV Owners - Backoffice only */}
          <Route
            path="/owners"
            element={
              <Private>
                {auth.isBackoffice() ? <Owners /> : <div>Forbidden</div>}
              </Private>
            }
          />

          {/* Stations - Both roles can view, only Backoffice can manage */}
          <Route
            path="/stations"
            element={
              <Private>
                {auth.isBackoffice() ? <Stations /> : <div>Forbidden</div>}
              </Private>
            }
          />

          <Route
            path="/my_stations"
            element={
              <Private>
                {auth.isStationOperator() ? (
                  <MyStations />
                ) : (
                  <div>Forbidden</div>
                )}
              </Private>
            }
          />
          {/* Bookings - Both roles */}
          <Route
            path="/bookings"
            element={
              <Private>
                {auth.isBackoffice() ? <Bookings /> : <div>Forbidden</div>}
              </Private>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
