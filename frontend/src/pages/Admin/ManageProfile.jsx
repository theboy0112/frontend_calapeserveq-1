import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./styles/ManageProfile.css";
import { useMutation, useQuery } from "@apollo/client";
import { UPDATE_ADMIN_PROFILE, UPDATE_PASSWORD } from "../../graphql/mutation";
import { GET_ADMIN_PROFILE } from "../../graphql/query";
import {
  FaUser,
  FaLock,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaEdit
} from "react-icons/fa";
import Swal from "sweetalert2";
import logo from "/calapelogo.png";

const ManageProfile = () => {
  const location = useLocation();
  const [profileData, setProfileData] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Determine staffId based on current route
  // Since this is the Admin Settings page, it should only be accessed from /admin/dashboard
  // Use admin-specific storage or fallback to sessionStorage
  const getAdminStaffId = () => {
    // Check if we're on admin dashboard route
    if (location.pathname.includes("/admin/dashboard")) {
      // Check if current session role is admin
      const role = sessionStorage.getItem("userRole") || localStorage.getItem("role");
      if (role === "admin") {
        // Try admin-specific storage first
        const adminId = localStorage.getItem("adminStaffId") || sessionStorage.getItem("staffId");
        if (adminId) return parseInt(adminId, 10);
        
        // Try to get from staffInfo
        const adminStaffInfo = sessionStorage.getItem("staffInfo") || localStorage.getItem("staffInfo");
        if (adminStaffInfo) {
          try {
            const parsed = JSON.parse(adminStaffInfo);
            if (parsed.role === "admin" && parsed.id) {
              return parseInt(parsed.id, 10);
            }
          } catch (e) {
            console.error("Error parsing admin staffInfo:", e);
          }
        }
        
        // Fallback to generic staffId
        const id = sessionStorage.getItem("staffId") || localStorage.getItem("staffId");
        if (id) return parseInt(id, 10);
      }
    }
    // Default fallback
    return 1;
  };

  const staffId = getAdminStaffId();

  const { data: adminData, loading, error, refetch } = useQuery(GET_ADMIN_PROFILE, {
    variables: { staffId },
    fetchPolicy: "network-only", 
  });

  const [updatePassword] = useMutation(UPDATE_PASSWORD, {
    onCompleted: () => {
      refetch();
      setSuccessMessage("Password changed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      console.error("Change Password error:", error);
    },
  });

  const [updateProfile] = useMutation(UPDATE_ADMIN_PROFILE, {
    onCompleted: () => {
      refetch();
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      console.error("Update error:", error);
    },
  });

  useEffect(() => {
    if (adminData && adminData.staff) {
      setProfileData({
        ...profileData,
        username: adminData.staff.staffUsername || "",
      });
    }
  }, [adminData]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!profileData.newPassword || !profileData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please fill out all password fields!",
      });
      return;
    }

    if (profileData.newPassword !== profileData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Passwords do not match!",
      });
      return;
    }

    if (profileData.newPassword.length < 6) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Password must be at least 6 characters long!",
      });
      return;
    }

    try {
      await updatePassword({
        variables: {
          staffId: staffId,
          newPassword: profileData.newPassword,
        },
      });
      setProfileData({
        ...profileData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setEditingPassword(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Password updated successfully!",
        timer: 2000,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update password!",
      });
    }
  };

  const handleCancelPassword = () => {
    setEditingPassword(false);
    setProfileData({
      ...profileData,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  if (loading) {
    return (
      <div className="profile-content">
        <div className="profile-card-wide">
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-content">
        <div className="error-message">Error loading profile: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="profile-content">
      {successMessage && (
        <div className="success-banner">
          <span>{successMessage}</span>
        </div>
      )}

      <div className="profile-card-wide">
        {/* Profile Header Section */}
        <div className="profile-header-section">
          <div className="avatar-container">
            <img 
              src={logo} 
              alt={`Profile picture for ${adminData?.staff?.staffFirstname || ''} ${adminData?.staff?.staffLastname || ''}`}
              className="profile-avatar"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="avatar-fallback">
              <FaUser />
            </div>
          </div>
          <div className="profile-info">
            <h2 className="profile-name">
              {adminData?.staff?.staffFirstname || "User"} {adminData?.staff?.staffLastname || ""}
            </h2>
            <p className="profile-role">Administrator</p>
            <p className="profile-username">@{adminData?.staff?.staffUsername || "username"}</p>
          </div>
        </div>

        <div className="profile-sections-container">
          {/* Username Section - Read Only */}
          <div className="settings-section">
            <div className="section-header">
              <div className="section-title">
                <FaUser className="section-icon" />
                <h3>Username</h3>
              </div>
            </div>
            <div className="settings-display">
              <div className="display-item">
                <span className="display-value">
                  {adminData?.staff?.staffUsername || "Not set"}
                </span>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="settings-section">
            <div className="section-header">
              <div className="section-title">
                <FaLock className="section-icon" />
                <h3>Password</h3>
              </div>
              {!editingPassword && (
                <button
                  onClick={() => setEditingPassword(true)}
                  className="edit-btn"
                  aria-label="Change password"
                >
                  <FaEdit />
                  Change Password
                </button>
              )}
            </div>

            {editingPassword ? (
              <form onSubmit={handleUpdatePassword} className="settings-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={profileData.currentPassword}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="Enter current password"
                      required
                      aria-required="true"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={profileData.newPassword}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Enter new password"
                      required
                      aria-required="true"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <p className="form-hint">Password must be at least 6 characters long</p>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={profileData.confirmPassword}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirm new password"
                      required
                      aria-required="true"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleCancelPassword}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <FaSave className="btn-icon" />
                    Update Password
                  </button>
                </div>
              </form>
            ) : (
              <div className="settings-display">
                <div className="display-item">
                  <span className="display-value">••••••••</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageProfile;