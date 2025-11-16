import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiUser,
  FiUsers,
  FiLogOut,
  FiSettings,
  FiBarChart2,
  FiFilter
} from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { Building2 } from "lucide-react";
import "./styles/Dashboard.css";


import ManageDepartment from "./ManageDepartment";
import ManageStaff from "./ManageStaff";
import ManageServices from "./ManageServices";
import ManageProfile from "./ManageProfile";
import ReportsPanel from "./ReportsPanel";

import { useQuery } from "@apollo/client";
import {
  GET_SERVICES,
  GET_DEPARTMENTS,
  GET_ALL_STAFF,
} from "../../graphql/query";

import logo from "/calapelogo.png";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [findAll, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);

  const { data: deptData } = useQuery(GET_DEPARTMENTS, { errorPolicy: 'all' });
  const { data: servData } = useQuery(GET_SERVICES, { errorPolicy: 'all' });
  const { data: staffData } = useQuery(GET_ALL_STAFF);

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isAdminLoggedIn");
    if (!isLoggedIn) {
      navigate("/admin");
    }
  }, [navigate]);

  useEffect(() => {
    if (Array.isArray(deptData?.departments)) {
      setDepartments(deptData.departments);
      return;
    }
    const svcs = Array.isArray(servData?.services) ? servData.services : [];
    const map = new Map();
    svcs.forEach((s) => {
      const d = s?.department;
      if (d?.departmentId && d?.departmentName) {
        map.set(d.departmentId, {
          departmentId: d.departmentId,
          departmentName: d.departmentName,
          prefix: d.departmentName.slice(0, 4).toUpperCase(),
        });
      }
    });
    if (map.size) setDepartments(Array.from(map.values()));
  }, [deptData, servData]);

  useEffect(() => {
    if (servData && servData.services) {
      setServices(servData.services);
    }
  }, [servData]);

 useEffect(() => {
  if (staffData && staffData.staffs) {
    setStaffList(staffData.staffs);
  }
}, [staffData]);


  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="welcome-section">
        <div className="welcome-header">
          <h1>Municipality of Calape</h1>
          <p>Smart Queue Management System</p>
        </div>
        <div className="welcome-time">
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card staff-card">
          <div className="stat-icon">
            <FiUsers size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{findAll.length}</div>
            <div className="stat-label">Total Staff</div>
          </div>
        </div>

        <div className="stat-card department-card">
          <div className="stat-icon">
            <Building2 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{departments.length}</div>
            <div className="stat-label">Departments</div>
          </div>
        </div>

        <div className="stat-card services-card">
          <div className="stat-icon">
            <FiSettings size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{services.length}</div>
            <div className="stat-label">Services</div>
          </div>
        </div>
      </div>

      <ReportsPanel departments={departments} />
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "profile":
        return <ManageProfile />;
      case "staff":
        return (
          <ManageStaff
            findAll={findAll}
            departments={departments}
            setStaffList={setStaffList}
          />
        );
      case "departments":
        return (
          <ManageDepartment
            departments={departments}
            setDepartments={setDepartments}
          />
        );
      case "services":
        return <ManageServices services={services} setServices={setServices} />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard">
        <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-header">
            <div className="header-top">
              <button
                className="hamburger-btn"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
            {sidebarOpen && (
              <>
                <div className="logo-wrapper">
                  <img src={logo} alt="Calape Logo" className="calape-logo" />
                </div>
                <h3>Admin Panel</h3>
              </>
            )}
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${
                activeSection === "dashboard" ? "active" : ""
              }`}
              onClick={() => setActiveSection("dashboard")}
              title="Dashboard"
            >
              <MdDashboard className="nav-icon" size={20} />
              {sidebarOpen && <span className="nav-text">Dashboard</span>}
            </button>

            <button
              className={`nav-item ${
                activeSection === "profile" ? "active" : ""
              }`}
              onClick={() => setActiveSection("profile")}
              title="Profile"
            >
              <FiUser className="nav-icon" size={20} />
              {sidebarOpen && <span className="nav-text">Profile</span>}
            </button>

            <button
              className={`nav-item ${activeSection === "staff" ? "active" : ""}`}
              onClick={() => setActiveSection("staff")}
              title="Manage Staff"
            >
              <FiUsers className="nav-icon" size={20} />
              {sidebarOpen && <span className="nav-text">Manage Staff</span>}
            </button>

            <button
              className={`nav-item ${
                activeSection === "departments" ? "active" : ""
              }`}
              onClick={() => setActiveSection("departments")}
              title="Manage Departments"
            >
              <Building2 className="nav-icon" size={20} />
              {sidebarOpen && <span className="nav-text">Manage Departments</span>}
            </button>

            <button
              className={`nav-item ${
                activeSection === "services" ? "active" : ""
              }`}
              onClick={() => setActiveSection("services")}
              title="Manage Services"
            >
              <FiSettings className="nav-icon" size={20} />
              {sidebarOpen && <span className="nav-text">Manage Services</span>}
            </button>
          </nav>

          <div className="sidebar-footer">
            <button onClick={handleLogout} className="logout-btn" title="Logout">
              <FiLogOut className="logout-icon" size={18} />
              {sidebarOpen && <span className="logout-text">Logout</span>}
            </button>
          </div>
        </div>

        <div
          className={`main-content ${
            sidebarOpen ? "sidebar-open" : "sidebar-closed"
          }`}
        >
          <div className="content-header">
            <div className="page-title">
              <h1>
                {activeSection === "dashboard" && "Dashboard"}
                {activeSection === "profile" && "Profile Settings"}
                {activeSection === "staff" && "Staff Management"}
                {activeSection === "departments" && "Department Management"}
                {activeSection === "services" && "Services Management"}
              </h1>
              <p className="page-subtitle">
                {activeSection === "dashboard" &&
                  "Overview of municipal operations"}
                {activeSection === "profile" &&
                  "Manage your account settings"}
                {activeSection === "staff" &&
                  "Manage staff members and roles"}
                {activeSection === "departments" &&
                  "Organize departments and structure"}
                {activeSection === "services" &&
                  "Manage municipal services and offerings"}
              </p>
            </div>
          </div>

          <div className="content-body">{renderContent()}</div>
        </div>

        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;