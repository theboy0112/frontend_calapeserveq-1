import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { LOGIN } from "../../graphql/mutation";
import "./styles/Login.css";
import logo from "/calapelogo.png";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [login] = useMutation(LOGIN);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await login({
        variables: {
          staffUsername: username.trim(),
          staffPassword: password.trim(),
        },
      });

      const loginData = data?.login;

      if (!loginData?.success) {
        Swal.fire({
          icon: "error",
          title: "Invalid credentials",
          text: "Please check your username and password.",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      const access_token = loginData.access_token || "";
      let role =
        loginData.role?.trim().toLowerCase() ||
        loginData.staff?.role?.roleName?.trim().toLowerCase() ||
        "";

      if (role.includes("queue") && role.includes("staff")) role = "queuestaff";

      const existingAdminData =
        role !== "admin"
          ? {
            adminStaffId: localStorage.getItem("adminStaffId"),
            adminStaffUsername: localStorage.getItem("adminStaffUsername"),
            adminStaffInfo: localStorage.getItem("adminStaffInfo"),
          }
          : null;

      const existingQueueStaffData =
        role !== "queuestaff"
          ? {
            queueStaffId: localStorage.getItem("queueStaffId"),
            queueStaffUsername: localStorage.getItem("queueStaffUsername"),
            queueStaffInfo: localStorage.getItem("queueStaffInfo"),
          }
          : null;

      const existingStaffData =
        role !== "staff"
          ? {
            staffId: sessionStorage.getItem("staffId") || localStorage.getItem("staffId"),
            staffUsername: sessionStorage.getItem("staffUsername") || localStorage.getItem("staffUsername"),
            staffInfo: sessionStorage.getItem("staffInfo") || localStorage.getItem("staffInfo"),
          }
          : null;

      console.log("Preserving data for other roles:", {
        existingAdminData,
        existingQueueStaffData,
        existingStaffData,
        currentRole: role,
      });

      sessionStorage.clear();

      const roleSpecificKeys = [
        "adminStaffId",
        "adminStaffUsername",
        "adminStaffInfo",
        "queueStaffId",
        "queueStaffUsername",
        "queueStaffInfo",
        "staffId",
        "staffUsername",
        "staffInfo",
      ];

      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!roleSpecificKeys.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      const staff = loginData.staff || {};
      const department = staff.department || {};

      const staffInfo = {
        id: staff.staffId || Date.now(),
        username: staff.staffUsername || username,
        firstName: staff.staffFirstname || "",
        lastName: staff.staffLastname || "",
        role: role,
        department: {
          id: parseInt(department.departmentId) || 0,
          name: department.departmentName?.trim() || "",
          prefix: department.prefix?.trim() || "",
        },
        token: access_token,
        loginTime: new Date().toISOString(),
      };

      console.log("Storing staff info:", staffInfo);

      localStorage.setItem("token", access_token);
      localStorage.setItem("role", role);

      sessionStorage.setItem("token", access_token);
      sessionStorage.setItem("userRole", role);
      sessionStorage.setItem("staffInfo", JSON.stringify(staffInfo));
      sessionStorage.setItem("staffId", staff.staffId || staffInfo.id);
      sessionStorage.setItem("isLoggedIn", "true");

      if (role === "admin") {
        sessionStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("adminStaffId", staff.staffId || staffInfo.id);
        localStorage.setItem("adminStaffUsername", staffInfo.username);
        localStorage.setItem("adminStaffInfo", JSON.stringify(staffInfo));
      } else if (role === "queuestaff") {
        sessionStorage.setItem("isQueueStaffLoggedIn", "true");
        localStorage.setItem("isQueueStaffLoggedIn", "true");
        localStorage.setItem("queueStaffId", staff.staffId || staffInfo.id);
        localStorage.setItem("queueStaffUsername", staffInfo.username);
        localStorage.setItem("queueStaffInfo", JSON.stringify(staffInfo));
      } else {
        sessionStorage.setItem("isStaffLoggedIn", "true");
        localStorage.setItem("isStaffLoggedIn", "true");
        localStorage.setItem("staffId", staff.staffId || staffInfo.id);
        localStorage.setItem("staffUsername", staffInfo.username);
        localStorage.setItem("staffInfo", JSON.stringify(staffInfo));
      }

      if (existingAdminData?.adminStaffId) {
        localStorage.setItem("adminStaffId", existingAdminData.adminStaffId);
        if (existingAdminData.adminStaffUsername) {
          localStorage.setItem(
            "adminStaffUsername",
            existingAdminData.adminStaffUsername,
          );
        }
        if (existingAdminData.adminStaffInfo) {
          localStorage.setItem(
            "adminStaffInfo",
            existingAdminData.adminStaffInfo,
          );
        }
        console.log("Restored admin data:", existingAdminData.adminStaffId);
      }

      if (existingQueueStaffData?.queueStaffId) {
        localStorage.setItem(
          "queueStaffId",
          existingQueueStaffData.queueStaffId,
        );
        if (existingQueueStaffData.queueStaffUsername) {
          localStorage.setItem(
            "queueStaffUsername",
            existingQueueStaffData.queueStaffUsername,
          );
        }
        if (existingQueueStaffData.queueStaffInfo) {
          localStorage.setItem(
            "queueStaffInfo",
            existingQueueStaffData.queueStaffInfo,
          );
        }
        console.log(
          "Restored queuestaff data:",
          existingQueueStaffData.queueStaffId,
        );
      }

      if (existingStaffData?.staffId && role !== "staff") {
        localStorage.setItem("staffId", existingStaffData.staffId);
        if (existingStaffData.staffUsername) {
          localStorage.setItem(
            "staffUsername",
            existingStaffData.staffUsername,
          );
        }
        if (existingStaffData.staffInfo) {
          localStorage.setItem("staffInfo", existingStaffData.staffInfo);
        }
        console.log("Restored staff data:", existingStaffData.staffId);
      }

      console.log("Final localStorage state:", {
        queueStaffId: localStorage.getItem("queueStaffId"),
        queueStaffUsername: localStorage.getItem("queueStaffUsername"),
        staffId: localStorage.getItem("staffId"),
        staffUsername: localStorage.getItem("staffUsername"),
        adminStaffId: localStorage.getItem("adminStaffId"),
        adminStaffUsername: localStorage.getItem("adminStaffUsername"),
      });

      Swal.fire({
        icon: "success",
        title: "Login successful",
        text: `Welcome ${staff.staffFirstname || ""}! Redirecting...`,
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });

      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (role === "queuestaff") {
          navigate("/queuestaff/dashboard", { replace: true });
        } else {
          navigate("/staff/dashboard", { replace: true });
        }
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      let message = "Login failed. Please try again.";
      if (error.graphQLErrors?.length) message = error.graphQLErrors[0].message;
      else if (error.networkError)
        message = "Network error. Check your connection.";

      Swal.fire({
        icon: "error",
        title: "Login failed",
        text: message,
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="login-page">
      <Header />

      <div className="login-background">
        <img
          src="/municipality.jpg"
          alt="Municipality Background"
          className="bg-image"
        />
        <div className="bg-overlay"></div>
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container">
              <div className="logo">
                <img
                  src={logo}
                  alt="CalapeServeQ Logo"
                  className="logo-image"
                />
              </div>
            </div>
            <h1 className="login-title">Login</h1>
            <p className="login-subtitle">
              Municipality of Calape Service Management
            </p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="password-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? <FaEyeSlash className="eye-icon" /> : <FaEye className="eye-icon" />}
                </button>
              </div>
              <div className="forgot-password-container">
                <button
                  type="button"
                  className="forgot-password-btn"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                className={`login-button ${isLoading ? "loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loading-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                ) : (
                  "Login"
                )}
              </button>
            </div>


          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
