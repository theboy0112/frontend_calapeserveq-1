import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { LOGIN } from "../../graphql/mutation";
import "./styles/Login.css";
import logo from "/calapelogo.png";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

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
          staffUsername: username,
          staffPassword: password,
        },
      });

      const loginData = data?.login;

      if (loginData?.success) {
        const access_token = loginData.access_token || "";

        let role =
          loginData.role?.trim().toLowerCase() ||
          loginData.staff?.role?.roleName?.trim().toLowerCase() ||
          "";

        // Normalize role names for consistency
        if (role.includes("queue") && role.includes("staff")) {
          role = "queuestaff";
        }

        sessionStorage.clear();
        localStorage.clear();

        localStorage.setItem("token", access_token);
        localStorage.setItem("role", role);
        sessionStorage.setItem("userRole", role);

        if (role === "admin") {
          sessionStorage.setItem("isAdminLoggedIn", "true");
          setTimeout(() => {
            navigate("/admin/dashboard", { replace: true });
          }, 100);
        } else if (role === "queuestaff") {
          // Queue Staff login logic
          const staff = loginData.staff || {};
          const department = staff.department || {};

          const staffInfo = {
            id: staff.staffId || Date.now(),
            username: staff.staffUsername || username,
            firstName: staff.staffFirstname || "",
            lastName: staff.staffLastname || "",
            role: "queuestaff",
            department: department.departmentId ? {
              id: parseInt(department.departmentId),
              name: department.departmentName?.trim() || "",
              prefix: department.prefix?.trim() || "",
            } : null,
            token: access_token,
            loginTime: new Date().toISOString(),
          };

          sessionStorage.setItem("staffInfo", JSON.stringify(staffInfo));
          sessionStorage.setItem("isQueueStaffLoggedIn", "true");

          setTimeout(() => {
            navigate("/queuestaff/dashboard", { replace: true });
          }, 100);
        } else {
          // Regular Staff login logic
          const staff = loginData.staff || {};
          const department = staff.department || {};

          if (
            !department.departmentId ||
            !department.departmentName ||
            !department.prefix
          ) {
            alert(
              "Invalid department information received. Please contact administrator."
            );
            return;
          }

          const staffInfo = {
            id: staff.staffId || Date.now(),
            username: staff.staffUsername || username,
            department: {
              id: parseInt(department.departmentId),
              name: department.departmentName.trim(),
              prefix: department.prefix.trim(),
            },
            token: access_token,
            loginTime: new Date().toISOString(),
          };

          sessionStorage.setItem("staffInfo", JSON.stringify(staffInfo));

          setTimeout(() => {
            navigate("/staff/dashboard", { replace: true });
          }, 100);
        }
      } else {
        alert("Invalid credentials.");
      }
    } catch (error) {
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        alert(`Login failed: ${error.graphQLErrors[0].message}`);
      } else if (error.networkError) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-page">
      <Header />
      
      <div className="login-background">
        <img src="/municipality.jpg" alt="Municipality Background" className="bg-image" />
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
                <img src={logo} alt="CalapeServeQ Logo" className="logo-image" />
              </div>
            </div>
            <h1 className="login-title">Login</h1>
            <p className="login-subtitle">Municipality of Calape Service Management</p>
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
                  <svg
                    className="eye-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
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
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;