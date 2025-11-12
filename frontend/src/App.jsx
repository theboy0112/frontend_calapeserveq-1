import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/UnifiedLogin/Login";
import StaffDashboard from "./pages/Staff/StaffDashboard";
import PrivateStaffRoute from "./routes/PrivateStaffRoute";
import Dashboard from "./pages/Admin/Dashboard";
import PrivateRoute from "./routes/PrivateRoute";
import TVmonitor from "./pages/Monitor/TVmonitor";
import QueueForm from "./pages/Citizens/QueueForm";
import QueueStaffRoute from "./routes/QueueStaffRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/tv-monitor" element={<TVmonitor />} />
       
        <Route element={<QueueStaffRoute />}>
          <Route
            path="/queuestaff/dashboard"
            element={<QueueForm />}
          />
    
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
