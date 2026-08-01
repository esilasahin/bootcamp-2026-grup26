import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import DashboardApp from "./DashboardApp";
import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";
import Register from "./Register";
import "./App.css";
import "./Auth.css";


function DashboardRoute() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("unimate_user");
  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;

  const handleLogout = () => {
    localStorage.removeItem("unimate_token");
    localStorage.removeItem("unimate_user");
    navigate("/login", { replace: true });
  };

  return (
    <DashboardApp
      currentUser={currentUser}
      onLogout={handleLogout}
    />
  );
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRoute />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}


export default App;