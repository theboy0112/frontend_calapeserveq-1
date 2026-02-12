import React, { useState, useEffect } from "react";
import "./styles/ManageStaff.css";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_STAFF,
  UPDATE_STAFF,
  DELETE_STAFF,
} from "../../graphql/mutation";
import {
  GET_ALL_STAFF,
  GET_DEPARTMENTS,
  GET_ROLES,
  GET_COUNTERS,
} from "../../graphql/query";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUserFriends,
  FaDesktop,
  FaBars,
} from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { HiUser } from "react-icons/hi";
import Swal from "sweetalert2";

const ManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [newStaff, setNewStaff] = useState({
    firstName: "",
    lastName: "",
    username: "",
    departmentId: "",
    roleId: "",
    counterId: "",
  });

  const {
    data: staffData,
    loading: staffLoading,
    error: staffError,
    refetch: refetchStaff,
  } = useQuery(GET_ALL_STAFF, {
    errorPolicy: "all",
  });
  const {
    data: departmentsData,
    loading: departmentsLoading,
    error: departmentsError,
  } = useQuery(GET_DEPARTMENTS);
  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
  } = useQuery(GET_ROLES);
  const {
    data: countersData,
    loading: countersLoading,
    error: countersError,
  } = useQuery(GET_COUNTERS, { errorPolicy: "all" });

  const isLoading =
    staffLoading || departmentsLoading || rolesLoading || countersLoading;

  const hasError =
    staffError || departmentsError || rolesError || countersError;

  const [createStaff] = useMutation(CREATE_STAFF, {
    onCompleted: async (data) => {
      await refetchStaff();
      Swal.fire({
        icon: "success",
        title: "Staff member created!",
        text: "The new staff record was added successfully. Temporary password has been sent to their email.",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Create staff error:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message || "Failed to create staff member!",
      });
    },
  });

  const [updateStaff] = useMutation(UPDATE_STAFF, {
    onCompleted: async (data) => {
      await refetchStaff();
      Swal.fire({
        icon: "success",
        title: "Staff member updated!",
        text: "Staff member updated successfully!",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Update staff error:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message || "Failed to update staff member!",
      });
    },
  });

  const [deleteStaff] = useMutation(DELETE_STAFF, {
    onCompleted: async (data) => {
      await refetchStaff();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The staff member has been successfully deleted.",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to delete staff member!",
      });
    },
  });

  useEffect(() => {
    if (staffData && staffData.staffs) {
      setStaff(staffData.staffs);
    }
  }, [staffData]);

  const filteredRoles =
    rolesData?.roles?.filter(
      (role) => role.roleName.toLowerCase() !== "admin",
    ) || [];

  // Filter counters based on selected department
  const filteredCounters = newStaff.departmentId
    ? countersData?.counters?.filter(
        (counter) =>
          counter.department?.departmentId === parseInt(newStaff.departmentId),
      ) || []
    : [];

  const handleAddStaff = async (e) => {
    e.preventDefault();

    if (editingStaff) {
      try {
        const selectedCounter = filteredCounters.find(
          (c) => c.counterId === parseInt(newStaff.counterId),
        );
        await updateStaff({
          variables: {
            updateStaffInput: {
              staffId: editingStaff.staffId,
              staffFirstname: newStaff.firstName,
              staffLastname: newStaff.lastName,
              counterId: newStaff.counterId
                ? parseInt(newStaff.counterId)
                : null,
            },
          },
        });
      } catch (error) {
        console.error("Update error:", error);
      }
      setEditingStaff(null);
    } else {
      try {
        const selectedCounter = filteredCounters.find(
          (c) => c.counterId === parseInt(newStaff.counterId),
        );
        await createStaff({
          variables: {
            createStaffInput: {
              staffFirstname: newStaff.firstName,
              staffLastname: newStaff.lastName,
              staffUsername: newStaff.username,
              roleId: parseInt(newStaff.roleId),
              departmentId: parseInt(newStaff.departmentId),
              counterId: newStaff.counterId ? parseInt(newStaff.counterId) : 0,
            },
          },
        });
      } catch (error) {
        console.error("Create error:", error);
      }
    }

    setNewStaff({
      firstName: "",
      lastName: "",
      username: "",
      departmentId: "",
      roleId: "",
      counterId: "",
    });
    setShowStaffForm(false);
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setNewStaff({
      firstName: staffMember.staffFirstname || "",
      lastName: staffMember.staffLastname || "",
      username: staffMember.staffUsername,
      departmentId: staffMember.department?.departmentId?.toString() || "",
      roleId: staffMember.role?.roleId?.toString() || "",
      counterId: staffMember.counter?.counterId?.toString() || "",
    });
    setShowStaffForm(true);
  };

  const handleCancelForm = () => {
    setShowStaffForm(false);
    setEditingStaff(null);
    setNewStaff({
      firstName: "",
      lastName: "",
      username: "",
      departmentId: "",
      roleId: "",
      counterId: "",
    });
  };

  const getStaffFullName = (member) => {
    const firstName = member.staffFirstname || "";
    const lastName = member.staffLastname || "";
    return `${firstName} ${lastName}`.trim() || member.staffUsername;
  };

  if (isLoading) {
    return (
      <div className="staff-content">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading staff data...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    const errorMessage =
      staffError?.message ||
      departmentsError?.message ||
      rolesError?.message ||
      "Unknown error occurred";
    return (
      <div className="staff-content">
        <div className="error-message">
          Error loading staff data: {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="staff-content">
      <div className="staff-table-container">
        <div className="table-header">
          <div className="table-title">
            <h3>All Staff Members</h3>
            <span className="staff-count">{staff.length} Total</span>
          </div>
        </div>

        <div className="staff-table">
          <table>
            <thead>
              <tr>
                <th>
                  <div className="th-content">
                    <HiUser className="th-icon" />
                    Full Name
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <FaUserFriends className="th-icon" />
                    Department
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <IoMdSettings className="th-icon" />
                    Role
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <FaDesktop className="th-icon" />
                    Counter
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <IoMdSettings className="th-icon" />
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.staffId} className="table-row">
                  <td className="staff-name-cell">
                    <div className="staff-info">
                      <div className="staff-avatar">
                        {(member.staffFirstname || member.staffUsername)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="staff-details">
                        <span className="staff-name">
                          {getStaffFullName(member)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="department-cell">
                    <span className="department-badge">
                      {member.department?.departmentName || "N/A"}
                    </span>
                  </td>
                  <td className="role-cell">
                    <span className="role-badge">
                      {member.role?.roleName || "N/A"}
                    </span>
                  </td>
                  <td className="counter-cell">
                    <span className="counter-badge">
                      {member.counter?.counterName || "N/A"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="actions">
                      <button
                        onClick={() => handleEditStaff(member)}
                        className="edit-btn"
                        title="Edit Staff Info"
                      >
                        <FaEdit className="btn-icon" />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {staff.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <FaUserFriends className="empty-icon" />
              </div>
              <h3>No Staff Members Yet</h3>
              <p>Start building your team by adding staff members</p>
              <button
                onClick={() => setShowStaffForm(true)}
                className="empty-state-btn"
              >
                <FaPlus className="btn-icon" />
                Add First Staff Member
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowStaffForm(true)}
          className="add-staff-floating-btn"
          title="Add Staff"
        >
          <FaPlus className="btn-icon" />
        </button>
      </div>

      {showStaffForm && (
        <div className="staff-form-overlay">
          <div className="staff-form-modal">
            <div className="modal-header">
              <h3>
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </h3>
              <button onClick={handleCancelForm} className="close-modal-btn">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddStaff}>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={newStaff.firstName}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, firstName: e.target.value })
                  }
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={newStaff.lastName}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, lastName: e.target.value })
                  }
                  placeholder="Enter last name"
                  required
                />
              </div>

              {!editingStaff && (
                <>
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={newStaff.departmentId}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          departmentId: e.target.value,
                          counterId: "", // Reset counter when department changes
                        })
                      }
                      required
                    >
                      <option value="" disabled>
                        Select Department{" "}
                      </option>

                      {departmentsData?.departments?.map((dept) => (
                        <option
                          key={dept.departmentId}
                          value={dept.departmentId}
                        >
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={newStaff.roleId}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          roleId: e.target.value,
                          counterId:
                            e.target.value !== "2" ? "" : newStaff.counterId, // Reset counter if not Staff role
                        })
                      }
                      required
                    >
                      <option value="" disabled>
                        Select Role
                      </option>
                      {filteredRoles.map((role) => (
                        <option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={newStaff.username}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, username: e.target.value })
                      }
                      placeholder="Enter username"
                      required
                    />
                  </div>

                  {newStaff.roleId === "2" && (
                    <div className="form-group">
                      <label>Counter (Optional)</label>
                      <select
                        value={newStaff.counterId}
                        onChange={(e) =>
                          setNewStaff({
                            ...newStaff,
                            counterId: e.target.value,
                          })
                        }
                        disabled={!newStaff.departmentId}
                      >
                        <option value="">
                          {newStaff.departmentId
                            ? "Select Counter (Optional)"
                            : "Select Department First"}
                        </option>
                        {filteredCounters.map((counter) => (
                          <option
                            key={counter.counterId}
                            value={counter.counterId}
                          >
                            {counter.counterName}
                          </option>
                        ))}
                      </select>
                      {!newStaff.departmentId && (
                        <small className="form-help">
                          Please select a department first to see available
                          counters
                        </small>
                      )}
                    </div>
                  )}
                </>
              )}

              {editingStaff && (
                <>
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={newStaff.departmentId}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          departmentId: e.target.value,
                          counterId: "", // Reset counter when department changes
                        })
                      }
                      disabled
                    >
                      <option value={newStaff.departmentId}>
                        {departmentsData?.departments?.find(
                          (dept) =>
                            dept.departmentId ===
                            parseInt(newStaff.departmentId),
                        )?.departmentName || "N/A"}
                      </option>
                    </select>
                    <small className="form-help">
                      Department cannot be changed after creation
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={newStaff.roleId}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          roleId: e.target.value,
                          counterId:
                            e.target.value !== "2" ? "" : newStaff.counterId, // Reset counter if not Staff role
                        })
                      }
                      disabled
                    >
                      <option value={newStaff.roleId}>
                        {rolesData?.roles?.find(
                          (role) => role.roleId === parseInt(newStaff.roleId),
                        )?.roleName || "N/A"}
                      </option>
                    </select>
                    <small className="form-help">
                      Role cannot be changed after creation
                    </small>
                  </div>

                  {newStaff.roleId === "2" && (
                    <div className="form-group">
                      <label>Counter (Optional)</label>
                      <select
                        value={newStaff.counterId}
                        onChange={(e) =>
                          setNewStaff({
                            ...newStaff,
                            counterId: e.target.value,
                          })
                        }
                        disabled={!newStaff.departmentId}
                      >
                        <option value="">
                          {newStaff.departmentId
                            ? "Select Counter (Optional)"
                            : "No Department Selected"}
                        </option>
                        {filteredCounters.map((counter) => (
                          <option
                            key={counter.counterId}
                            value={counter.counterId}
                          >
                            {counter.counterName}
                          </option>
                        ))}
                      </select>
                      {!newStaff.departmentId && (
                        <small className="form-help">
                          No department selected
                        </small>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingStaff ? "Update Staff" : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaff;
