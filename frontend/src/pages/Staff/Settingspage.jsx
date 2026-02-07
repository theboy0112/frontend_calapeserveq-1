import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Palette,
  Save,
  Eye,
  EyeOff,
  Loader2,
  WifiOff,
  X,
} from "lucide-react";
import "./styles/Settingspage.css";
import { useMutation, useQuery } from "@apollo/client";
import { GET_STAFF_PROFILE } from "../../graphql/query";
import { UPDATE_PASSWORD } from "../../graphql/mutation";

const SettingsPage = ({ onClose }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("account");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Get staff credentials from localStorage
  const getStaffCredentials = () => {
    // Prioritize sessionStorage for tab-level isolation
    const id = sessionStorage.getItem("staffId") || localStorage.getItem("staffId");
    const username = localStorage.getItem("staffUsername");
    const staffInfoStr = sessionStorage.getItem("staffInfo") || localStorage.getItem("staffInfo");

    if (staffInfoStr) {
      try {
        const parsed = JSON.parse(staffInfoStr);
        if (
          (parsed.role?.toLowerCase() === "staff" || parsed.role?.toLowerCase() === "queuestaff") &&
          String(parsed.id) === String(id)
        ) {
          return { staffId: id, staffUsername: parsed.username || username };
        }
      } catch (e) {
        console.error("Error parsing staffInfo:", e);
      }
    }

    return { staffId: id, staffUsername: username || "Staff User" };
  };

  const { staffId, staffUsername } = getStaffCredentials();

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch staff profile
  const {
    data: staffData,
    loading: staffLoading,
    error: staffError,
    refetch: refetchStaff,
  } = useQuery(GET_STAFF_PROFILE, {
    variables: { staffId: staffId ? parseInt(staffId, 10) : null },
    skip: !staffId,
    fetchPolicy: "network-only",
  });

  const staffInfo = staffData?.staff || staffData?.getStaffProfile || null;

  // Form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Theme state
  const [themeSettings, setThemeSettings] = useState({
    theme: localStorage.getItem("theme") || "light",
  });

  // Apollo mutation
  const [updatePassword] = useMutation(UPDATE_PASSWORD);

  // Apply saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Handle input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setMessage({ type: "", text: "" });
  };

  // Handle theme change
  const handleThemeChange = (theme) => {
    setThemeSettings({ theme });
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);

    try {
      const channel = new BroadcastChannel("theme-updates");
      channel.postMessage({ type: "THEME_CHANGED", theme });
      channel.close();
    } catch (e) {
      console.warn("BroadcastChannel not available:", e);
    }

    setMessage({ type: "success", text: `Theme changed to ${theme}` });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  // Handle password submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!isOnline) {
      setMessage({ type: "error", text: "No internet connection." });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "All fields are required." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const { data } = await updatePassword({
        variables: {
          staffId: parseInt(staffId, 10),
          newPassword,
          // If backend expects currentPassword, include it here
          // currentPassword,
        },
      });

      if (data?.updatePassword) {
        setMessage({ type: "success", text: "Password updated successfully!" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setMessage({
        type: "error",
        text: error?.graphQLErrors?.[0]?.message || error.message || "Failed to update password",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (staffLoading) {
    return (
      <div className="settings-modal-overlay" onClick={onClose}>
        <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="settings-loading-container">
            <Loader2 className="settings-spinner" size={40} />
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOnline || staffError) {
    return (
      <div className="settings-modal-overlay" onClick={onClose}>
        <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="settings-error-container">
            <WifiOff size={48} className="settings-error-icon" />
            <h2>Connection Error</h2>
            <p>
              {!isOnline
                ? "No internet connection."
                : staffError?.message || "Failed to load settings."}
            </p>
            <button
              className="settings-retry-btn"
              onClick={() => (isOnline ? refetchStaff() : window.location.reload())}
            >
              Retry
            </button>
            <button className="settings-back-btn-error" onClick={onClose}>
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div
        className="settings-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <div className="settings-header-content">
            <h1 className="settings-title">Staff Settings</h1>
            <p className="settings-subtitle">
              Manage your staff account preferences
            </p>
          </div>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!isOnline && (
          <div className="settings-message settings-message-warning">
            <WifiOff size={16} />
            <span>You are currently offline. Some features may not work.</span>
          </div>
        )}

        {message.text && (
          <div className={`settings-message settings-message-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === "account" ? "settings-tab-active" : ""
              }`}
            onClick={() => setActiveTab("account")}
          >
            <User size={16} />
            <span>Account</span>
          </button>
          <button
            className={`settings-tab ${activeTab === "theme" ? "settings-tab-active" : ""
              }`}
            onClick={() => setActiveTab("theme")}
          >
            <Palette size={16} />
            <span>Theme</span>
          </button>
        </div>

        <div className="settings-content-area">
          {activeTab === "account" && (
            <div className="settings-section">
              <div className="settings-section-header">
                <h2>Staff Account Information</h2>
                <p>View your staff account details</p>
              </div>

              <div className="settings-info-section">
                <div className="settings-info-item">
                  <label>Username</label>
                  <div className="settings-info-value">
                    {staffUsername || "N/A"}
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>First Name</label>
                  <div className="settings-info-value">
                    {staffInfo?.staffFirstname ||
                      staffInfo?.firstName ||
                      staffInfo?.firstname ||
                      "N/A"}
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>Last Name</label>
                  <div className="settings-info-value">
                    {staffInfo?.staffLastname ||
                      staffInfo?.lastName ||
                      staffInfo?.lastname ||
                      "N/A"}
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>User Type</label>
                  <div className="settings-info-value">Staff</div>
                </div>
              </div>

              <div className="settings-divider"></div>

              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <h3 className="settings-subsection-title">Change Password</h3>
                <p className="settings-subsection-subtitle">
                  Update your staff account password
                </p>

                <div className="settings-form-group">
                  <label htmlFor="currentPassword">Current Password *</label>
                  <div className="settings-password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="settings-input"
                      required
                    />
                    <button
                      type="button"
                      className="settings-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="newPassword">New Password *</label>
                    <div className="settings-password-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="settings-input"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="settings-password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="confirmPassword">
                      Confirm New Password *
                    </label>
                    <div className="settings-password-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className="settings-input"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="settings-password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-form-actions">
                  <button
                    type="submit"
                    className="settings-save-btn"
                    disabled={isSubmitting || !isOnline}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="settings-spinner" size={16} />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "theme" && (
            <div className="settings-section">
              <div className="settings-section-header">
                <h2>Theme Preferences</h2>
                <p>Choose your preferred color scheme</p>
              </div>

              <div className="theme-options">
                <div
                  className={`theme-option ${themeSettings.theme === "light" ? "theme-option-active" : ""
                    }`}
                  onClick={() => handleThemeChange("light")}
                >
                  <div className="theme-preview theme-preview-light">
                    <div className="theme-preview-header"></div>
                    <div className="theme-preview-body"></div>
                  </div>
                  <div className="theme-info">
                    <h3>Light</h3>
                    <p>Classic bright theme</p>
                  </div>
                  {themeSettings.theme === "light" && (
                    <div className="theme-checkmark">✓</div>
                  )}
                </div>

                <div
                  className={`theme-option ${themeSettings.theme === "dark" ? "theme-option-active" : ""
                    }`}
                  onClick={() => handleThemeChange("dark")}
                >
                  <div className="theme-preview theme-preview-dark">
                    <div className="theme-preview-header"></div>
                    <div className="theme-preview-body"></div>
                  </div>
                  <div className="theme-info">
                    <h3>Dark</h3>
                    <p>Easy on the eyes</p>
                  </div>
                  {themeSettings.theme === "dark" && (
                    <div className="theme-checkmark">✓</div>
                  )}
                </div>

                <div
                  className={`theme-option ${themeSettings.theme === "dim" ? "theme-option-active" : ""
                    }`}
                  onClick={() => handleThemeChange("dim")}
                >
                  <div className="theme-preview theme-preview-dim">
                    <div className="theme-preview-header"></div>
                    <div className="theme-preview-body"></div>
                  </div>
                  <div className="theme-info">
                    <h3>Dim Light</h3>
                    <p>Softer alternative</p>
                  </div>
                  {themeSettings.theme === "dim" && (
                    <div className="theme-checkmark">✓</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
