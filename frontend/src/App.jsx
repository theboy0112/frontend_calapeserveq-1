import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/UnifiedLogin/Login";
import ForgotPassword from "./pages/UnifiedLogin/Forgotpassword";
import ResetPassword from "./pages/UnifiedLogin/ResetPassword";
import StaffDashboard from "./pages/Staff/StaffDashboard";
import PrivateStaffRoute from "./routes/PrivateStaffRoute";
import Dashboard from "./pages/Admin/Dashboard";
import PrivateRoute from "./routes/PrivateRoute";
import TVmonitor from "./pages/Monitor/TVmonitor";
import QueueForm from "./pages/Citizens/QueueForm";
import QueueStaffRoute from "./routes/QueueStaffRoute";
import UtilsHome from "./pages/Client/Home";
import ClientQueue from "./pages/Client/ClientQueue";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<UtilsHome />} />
        <Route path="/queue" element={<ClientQueue />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/tv-monitor" element={<TVmonitor />} />

        <Route element={<QueueStaffRoute />}>
          <Route path="/queuestaff/dashboard" element={<QueueForm />} />
        </Route>
        <Route path="/staff" element={<PrivateStaffRoute />}>
          <Route path="dashboard" element={<StaffDashboard />} />
        </Route>

        <Route
          path="/admin/dashboard"
          element={<PrivateRoute element={<Dashboard />} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
