import React, { useState, useEffect } from "react";
import "./styles/ManageStaff.css";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_STAFF,
  UPDATE_STAFF,
  DELETE_STAFF,
} from "../../graphql/mutation";
import { GET_ALL_STAFF, GET_DEPARTMENTS, GET_ROLES } from "../../graphql/query";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUserFriends,
} from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { HiUser } from "react-icons/hi";
import Swal from "sweetalert2";

const ManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [newStaff, setNewStaff] = useState({
    firstName: "",
    lastName: "",
    username: "",
    departmentId: "",
    roleId: "",
  });

  const { data: staffData, refetch: refetchStaff } = useQuery(GET_ALL_STAFF);
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS);
  const { data: rolesData } = useQuery(GET_ROLES);

  const [createStaff] = useMutation(CREATE_STAFF, {
    onCompleted: (data) => {
      console.log("Staff created:", data);
      refetchStaff();
      Swal.fire({
        icon: "success",
        title: "Staff member created!",
        text: "The new staff record was added successfully. Temporary password has been sent to their email.",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Create staff error:", error);
    },
  });

  const [updateStaff] = useMutation(UPDATE_STAFF, {
    onCompleted: () => {
      refetchStaff();
    },
  });

  const [deleteStaff] = useMutation(DELETE_STAFF, {
    onCompleted: () => {
      refetchStaff();
    },
  });

 useEffect(() => {
  if (staffData && staffData.staffs) {
    setStaff(staffData.staffs);
  }
}, [staffData]);;

  
  const filteredRoles =
    rolesData?.roles?.filter(
      (role) => role.roleName.toLowerCase() !== "admin"
    ) || [];

  const handleAddStaff = async (e) => {
    e.preventDefault();

    if (editingStaff) {
      try {
        await updateStaff({
          variables: {
            updateStaffInput: {
              staffId: editingStaff.staffId,
              staffFirstname: newStaff.firstName,
              staffLastname: newStaff.lastName,
            },
          },
        });
        Swal.fire({
          icon: "success",
          title: "Staff member updated!",
          text: "Staff member updated successfully!",
          confirmButtonColor: "#3085d6",
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      }
      setEditingStaff(null);
    } else {
      try {
        await createStaff({
          variables: {
            createStaffInput: {
              staffFirstname: newStaff.firstName,
              staffLastname: newStaff.lastName,
              staffUsername: newStaff.username,
              roleId: parseInt(newStaff.roleId),
              departmentId: parseInt(newStaff.departmentId),
            },
          },
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      }
    }

    setNewStaff({
      firstName: "",
      lastName: "",
      username: "",
      departmentId: "",
      roleId: "",
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
      roleId: "",
    });
    setShowStaffForm(true);
  };

  const handleDeleteStaff = async (staffId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This staff member will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteStaff({ variables: { staffId: parseInt(staffId) } });
        await refetchStaff();

        setStaff(staff.filter((member) => member.staffId !== Number(staffId)));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "The staff member has been successfully deleted.",
          confirmButtonColor: "#3085d6",
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong while deleting the staff member!",
        });
      }
    }
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
    });
  };

  const getStaffFullName = (member) => {
    const firstName = member.staffFirstname || "";
    const lastName = member.staffLastname || "";
    return `${firstName} ${lastName}`.trim() || member.staffUsername;
  };

  return (
    <div className="staff-content">
      <div className="staff-header">
        <div className="header-content">
          <h2>Staff Management</h2>
          <p className="header-subtitle">
            Manage staff members and their roles
          </p>
        </div>
        <button
          onClick={() => setShowStaffForm(true)}
          className="add-staff-btn"
        >
          <FaPlus className="btn-icon" />
          Add Staff
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
                        })
                      }
                      required
                    >
                      <option value=""disabled>Select Department </option>
                      
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
                        setNewStaff({ ...newStaff, roleId: e.target.value })
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
                      <button
                        onClick={() => handleDeleteStaff(member.staffId)}
                        className="delete-btn"
                        title="Delete Staff"
                      >
                        <FaTrash className="btn-icon" />
                        Delete
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
      </div>
    </div>
  );
};

export default ManageStaff;
