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
import { UPDATE_STAFF } from "../../graphql/mutation";

const SettingsPage = ({ onClose }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("account");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Determine staff credentials based on current route ONLY
  // This Settings page is for regular staff, so it should only be accessed from /staff/dashboard
  // We check the route, not the session role, to ensure we show the correct data for this dashboard
  const getStaffCredentials = () => {
    // Check if we're on staff dashboard route
    if (location.pathname.includes("/staff/dashboard")) {
      // Try role-specific storage first (preserved across logins)
      const staffInfoStr = localStorage.getItem("staffInfo");
      if (staffInfoStr) {
        try {
          const parsed = JSON.parse(staffInfoStr);
          const parsedRole = parsed.role?.toLowerCase().replace(/\s+/g, '');
          // Only use if it's staff data (not queuestaff or admin)
          if (parsedRole === "staff" && parsed.id) {
            return {
              staffId: parsed.id.toString(),
              staffUsername: parsed.username || localStorage.getItem("staffUsername")
            };
          }
        } catch (e) {
          console.error("Error parsing staffInfo:", e);
        }
      }
      
      // Fallback to role-specific keys (these persist across logins)
      const id = localStorage.getItem("staffId");
      const username = localStorage.getItem("staffUsername");
      if (id) {
        return { 
          staffId: id, 
          staffUsername: username || "Staff User" 
        };
      }
    }
    // Default fallback
    return {
      staffId: localStorage.getItem("staffId"),
      staffUsername: localStorage.getItem("staffUsername")
    };
  };

  const { staffId, staffUsername } = getStaffCredentials();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get regular staff profile
  const {
    data: staffData,
    loading: staffLoading,
    error: staffError,
    refetch: refetchStaff
  } = useQuery(GET_STAFF_PROFILE, {
    variables: { 
      staffId: staffId ? parseInt(staffId, 10) : null 
    },
    skip: !staffId,
    fetchPolicy: "network-only",
  });

  const staffInfo = staffData?.staff || staffData?.getStaffProfile || null;

  // Password form state only
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Theme settings state
  const [themeSettings, setThemeSettings] = useState({
    theme: localStorage.getItem("theme") || "light",
  });

  // Update mutation for regular staff
  const [updateStaff] = useMutation(UPDATE_STAFF);

  // Apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage({ type: "", text: "" });
  };

  const handleThemeChange = (theme) => {
    setThemeSettings({ theme });
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    
    // Broadcast theme change to other tabs
    try {
      const channel = new BroadcastChannel('theme-updates');
      channel.postMessage({ type: 'THEME_CHANGED', theme });
      channel.close();
    } catch (e) {
      console.warn('BroadcastChannel not available:', e);
    }
    
    setMessage({ 
      type: "success", 
      text: `Theme changed to ${theme}` 
    });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      setMessage({ 
        type: "error", 
        text: "No internet connection. Please check your network." 
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      // Validate passwords
      if (!passwordForm.currentPassword) {
        setMessage({ 
          type: "error", 
          text: "Current password is required" 
        });
        setIsSubmitting(false);
        return;
      }

      if (!passwordForm.newPassword) {
        setMessage({ 
          type: "error", 
          text: "New password is required" 
        });
        setIsSubmitting(false);
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setMessage({ 
          type: "error", 
          text: "New passwords do not match" 
        });
        setIsSubmitting(false);
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setMessage({ 
          type: "error", 
          text: "New password must be at least 6 characters" 
        });
        setIsSubmitting(false);
        return;
      }

      const updateData = {
        staffId: parseInt(staffId, 10),
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      };

      const { data } = await updateStaff({
        variables: { 
          updateStaffInput: updateData 
        }
      });

      if (data?.updateStaff) {
        setMessage({ 
          type: "success", 
          text: "Password updated successfully" 
        });
        
        // Clear password fields
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      console.error("Error updating password:", error);
      const errorMsg = 
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        "Failed to update password";
      setMessage({ 
        type: "error", 
        text: errorMsg 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
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

  // Show error if no internet or query error
  if (!isOnline || staffError) {
    return (
      <div className="settings-modal-overlay" onClick={onClose}>
        <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="settings-error-container">
            <WifiOff size={48} className="settings-error-icon" />
            <h2>Connection Error</h2>
            <p>
              {!isOnline 
                ? "No internet connection. Please check your network."
                : staffError?.message || "Failed to load settings."}
            </p>
            <button 
              className="settings-retry-btn"
              onClick={() => {
                if (isOnline) {
                  refetchStaff();
                } else {
                  window.location.reload();
                }
              }}
            >
              Retry
            </button>
            <button 
              className="settings-back-btn-error"
              onClick={onClose}
            >
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
      <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <button 
            className="settings-back-btn"
            onClick={onClose}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="settings-header-content">
            <h1 className="settings-title">Staff Settings</h1>
            <p className="settings-subtitle">
              Manage your staff account preferences
            </p>
          </div>
          <button 
            className="settings-close-btn"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Offline Warning */}
        {!isOnline && (
          <div className="settings-message settings-message-warning">
            <WifiOff size={16} />
            <span>You are currently offline. Some features may not work.</span>
          </div>
        )}

        {/* Message Display */}
        {message.text && (
          <div className={`settings-message settings-message-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === "account" ? "settings-tab-active" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            <User size={16} />
            <span>Account</span>
          </button>
          <button
            className={`settings-tab ${activeTab === "theme" ? "settings-tab-active" : ""}`}
            onClick={() => setActiveTab("theme")}
          >
            <Palette size={16} />
            <span>Theme</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="settings-content-area">
          {activeTab === "account" && (
            <div className="settings-section">
              <div className="settings-section-header">
                <h2>Staff Account Information</h2>
                <p>View your staff account details</p>
              </div>

              {/* Account Info - Read Only */}
              <div className="settings-info-section">
                <div className="settings-info-item">
                  <label>Username</label>
                  <div className="settings-info-value">{staffUsername || "N/A"}</div>
                </div>

                <div className="settings-info-item">
                  <label>First Name</label>
                  <div className="settings-info-value">
                    {staffInfo?.staffFirstname || staffInfo?.firstName || staffInfo?.firstname || "N/A"}
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>Last Name</label>
                  <div className="settings-info-value">
                    {staffInfo?.staffLastname || staffInfo?.lastName || staffInfo?.lastname || "N/A"}
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>User Type</label>
                  <div className="settings-info-value">Staff</div>
                </div>
              </div>

              <div className="settings-divider"></div>

              {/* Password Change Form */}
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
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="confirmPassword">Confirm New Password *</label>
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
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  className={`theme-option ${themeSettings.theme === "light" ? "theme-option-active" : ""}`}
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
                  className={`theme-option ${themeSettings.theme === "dark" ? "theme-option-active" : ""}`}
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
                  className={`theme-option ${themeSettings.theme === "dim" ? "theme-option-active" : ""}`}
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