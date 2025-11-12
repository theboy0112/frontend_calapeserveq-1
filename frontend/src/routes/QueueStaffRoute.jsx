import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const QueueStaffRoute = () => {
  const role = sessionStorage.getItem("userRole");
  const isQueueStaff = role?.toLowerCase().replace(/\s+/g, '') === "queuestaff";
  
  return isQueueStaff ? <Outlet /> : <Navigate to="/login" replace />;
};

export default QueueStaffRoute;