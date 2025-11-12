import React, { useState, useEffect } from "react";
import "./styles/ManageProfile.css";
import { useMutation, useQuery } from "@apollo/client";
import { UPDATE_ADMIN_PROFILE } from "../../graphql/mutation";
import { GET_ADMIN_PROFILE } from "../../graphql/query";
import {
  FaUser,
  FaLock,
  FaSave,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import Swal from "sweetalert2";
import logo from "/calapelogo.png";

const ManageProfile = () => {
  const [profileData, setProfileData] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const staffId = parseInt(sessionStorage.getItem("staffId")) || 1;

  const { data: adminData, loading, error, refetch } = useQuery(GET_ADMIN_PROFILE, {
    variables: { staffId },
    fetchPolicy: "network-only", 
  });

  console.log("Admin Data:", adminData);

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

  const handleUpdateUsername = async (e) => {
    e.preventDefault();

    if (!profileData.username.trim()) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Username cannot be empty!",
      });
      return;
    }

    try {
      await updateProfile({
        variables: {
          updateStaffInput: {
            staffId: staffId,
            staffUsername: profileData.username,
          },
        },
      });
      setEditingUsername(false);
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Username updated successfully!",
        timer: 2000,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update username!",
      });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (profileData.newPassword !== profileData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "New password and confirm password don't match!",
      });
      return;
    }

    if (profileData.newPassword.length < 6) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Password must be at least 8 characters long!",
      });
      return;
    }

    try {
      await updateProfile({
        variables: {
          updateStaffInput: {
            staffId: staffId,
            currentPassword: profileData.currentPassword,
            staffPassword: profileData.newPassword,
          },
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
        text: "Failed to update password! Make sure your current password is correct.",
      });
    }
  };

  const handleCancelUsername = () => {
    setEditingUsername(false);
    setProfileData({
      ...profileData,
      username: adminData?.staff?.staffUsername || "",
    });
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
        <div className="loading-spinner">Loading profile...</div>
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
      <div className="profile-header">
        <div className="header-content">
          <h2>Profile Settings</h2>
          <p className="header-subtitle">Manage your account information</p>
        </div>
      </div>

      {successMessage && (
        <div className="success-banner">
          <span>{successMessage}</span>
        </div>
      )}

      <div className="profile-container">
        {/* Profile Avatar Section */}
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            <div className="profile-logo">
              <img src={logo} alt="Calape Logo" className="calape-logo" />
            </div>
            <div className="avatar-info">
              <h3>
                {adminData?.staff?.staffFirstname || ""}{" "}
                {adminData?.staff?.staffLastname || ""}
              </h3>
              <p className="role-badge">Administrator</p>
              <p className="username-display">@{adminData?.staff?.staffUsername || "username"}</p>
            </div>
          </div>
        </div>

        {/* Username Section */}
        <div className="profile-section">
          <div className="section-header">
            <div className="section-title">
              <FaUser className="section-icon" />
              <h3>Username</h3>
            </div>
            {!editingUsername && (
              <button
                onClick={() => setEditingUsername(true)}
                className="edit-section-btn"
              >
                Edit
              </button>
            )}
          </div>

          {editingUsername ? (
            <form onSubmit={handleUpdateUsername} className="profile-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) =>
                    setProfileData({ ...profileData, username: e.target.value })
                  }
                  placeholder="Enter new username"
                  required
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancelUsername}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  <FaSave className="btn-icon" />
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info-display">
              <div className="info-item">
                <span className="info-label">Current Username:</span>
                <span className="info-value">
                  {adminData?.staff?.staffUsername || "Not set"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Password Section */}
        <div className="profile-section">
          <div className="section-header">
            <div className="section-title">
              <FaLock className="section-icon" />
              <h3>Password</h3>
            </div>
            {!editingPassword && (
              <button
                onClick={() => setEditingPassword(true)}
                className="edit-section-btn"
              >
                Change Password
              </button>
            )}
          </div>

          {editingPassword ? (
            <form onSubmit={handleUpdatePassword} className="profile-form">
              <div className="form-group">
                <label>Current Password</label>
                <div className="password-input-wrapper">
                  <input
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
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
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
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <small className="form-help">
                  Password must be at least 8 characters long
                </small>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
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
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancelPassword}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  <FaSave className="btn-icon" />
                  Update Password
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info-display">
              <div className="info-item">
                <span className="info-label">Password:</span>
                <span className="info-value">••••••••</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageProfile;