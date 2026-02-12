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
  FiFilter,
  FiImage,
  FiTrash2,
  FiEdit,
  FiUpload,
  FiDownload,
  FiMonitor,
} from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { Building2 } from "lucide-react";
import "./styles/Dashboard.css";

import ManageDepartment from "./ManageDepartment";
import ManageStaff from "./ManageStaff";
import ManageServices from "./ManageServices";
import ManageProfile from "./ManageProfile";
import ManageAds from "./ManageAds";
import ManageCounter from "./ManageCounter";
import ReportsPanel from "./ReportsPanel";
import Reports from "./Reports";
import ScrollHint from "../../components/ScrollHint/ScrollHint";
import { useQuery } from "@apollo/client";
import {
  GET_SERVICES,
  GET_DEPARTMENTS,
  GET_ALL_STAFF,
  GET_COUNTERS,
} from "../../graphql/query";

import logo from "/calapelogo.png";
import Swal from "sweetalert2";
import { logoutPreservingRoleData } from "../../utils/logoutHelper";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [findAll, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [counters, setCounters] = useState([]);
  const [reports, setReports] = useState([]);

  const { data: deptData } = useQuery(GET_DEPARTMENTS, { errorPolicy: "all" });
  const { data: servData } = useQuery(GET_SERVICES, { errorPolicy: "all" });
  const { data: staffData } = useQuery(GET_ALL_STAFF);
  const { data: counterData } = useQuery(GET_COUNTERS, { errorPolicy: "all" });

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

  useEffect(() => {
    if (counterData && counterData.counters) {
      setCounters(counterData.counters);
    }
  }, [counterData]);

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        logoutPreservingRoleData();
        navigate("/login");

        Swal.fire({
          icon: "success",
          title: "You have logged out successfully",
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });
      }
    });
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

      <ScrollHint />

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
          <div className="manage-section-wrapper">
            <ManageStaff
              findAll={findAll}
              departments={departments}
              setStaffList={setStaffList}
            />
            <ScrollHint text="Scroll table horizontally" />
          </div>
        );
      case "departments":
        return (
          <div className="manage-section-wrapper">
            <ManageDepartment
              departments={departments}
              setDepartments={setDepartments}
            />
            <ScrollHint text="Scroll table horizontally" />
          </div>
        );
      case "services":
        return <ManageServices services={services} setServices={setServices} />;
      case "counters":
        return <ManageCounter counters={counters} setCounters={setCounters} />;
      case "ads":
        return <ManageAds />;
      case "reports":
        return <Reports departments={departments} />;
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
              className={`nav-item ${
                activeSection === "staff" ? "active" : ""
              }`}
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
              {sidebarOpen && (
                <span className="nav-text">Manage Departments</span>
              )}
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

            <button
              className={`nav-item ${
                activeSection === "counters" ? "active" : ""
              }`}
              onClick={() => setActiveSection("counters")}
              title="Manage Counters"
            >
              <FiMonitor className="nav-icon" size={20} />
              {sidebarOpen && <span className="nav-text">Manage Counters</span>}
            </button>

            <button
              className={`nav-item ${activeSection === "ads" ? "active" : ""}`}
              onClick={() => setActiveSection("ads")}
              title="Manage Ads"
            >
              <FiImage className="nav-icon" size={20} />
              {sidebarOpen && <span className="nav-text">Manage Ads</span>}
            </button>
            <button
              className={`nav-item ${
                activeSection === "reports" ? "active" : ""
              }`}
              onClick={() => setActiveSection("reports")}
              title="Reports"
            >
              <FiDownload className="nav-icon" size={20} />
              {sidebarOpen && (
                <span className="nav-text">Download Reports</span>
              )}
            </button>
          </nav>

          <div className="sidebar-footer">
            <button
              onClick={handleLogout}
              className="logout-btn"
              title="Logout"
            >
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
            <div className="header-left">
              {!sidebarOpen && (
                <button
                  className="mobile-toggle-btn"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <FiMenu size={20} />
                </button>
              )}
              <div className="page-title">
                <h1>
                  {activeSection === "dashboard" && "Dashboard"}
                  {activeSection === "profile" && "Profile Settings"}
                  {activeSection === "staff" && "Staff Management"}
                  {activeSection === "departments" && "Department Management"}
                  {activeSection === "services" && "Services Management"}
                  {activeSection === "counters" && "Counter Management"}
                  {activeSection === "ads" && "Advertisement Management"}
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
                  {activeSection === "counters" &&
                    "Manage service counters and their departments"}
                  {activeSection === "ads" &&
                    "Upload and manage advertisements for TV monitors"}
                </p>
              </div>
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
