import React, { useState, useEffect } from "react";
import "./styles/ManageDepartment.css";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_DEPARTMENT,
  UPDATE_DEPARTMENT,
  DELETE_DEPARTMENT,
} from "../../graphql/mutation";
import { GET_DEPARTMENTS } from "../../graphql/query";
import { FaPlus, FaEdit, FaTrash, FaTimes, FaFolder } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { HiOfficeBuilding } from "react-icons/hi";

const ManageDepartment = ({ departments, setDepartments }) => {
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    prefix: "",
  });

  const { data, refetch } = useQuery(GET_DEPARTMENTS);

  const [updateDepartment] = useMutation(UPDATE_DEPARTMENT, {
    onCompleted: () => {
      refetch();
    },
  });

  const [deleteDepartment] = useMutation(DELETE_DEPARTMENT, {
    onCompleted: () => {
      refetch();
    },
  });

  const [createDepartment] = useMutation(CREATE_DEPARTMENT, {
    onCompleted: () => {
      refetch();
    },
  });

  useEffect(() => {
    if (data && data.departments) {
      setDepartments(data.departments);
    }
  }, [data, setDepartments]);

  const handleAddDepartment = async (e) => {
    e.preventDefault();

    if (editingDepartment) {
      try {
        const result = await updateDepartment({
          variables: {
            updateDepartmentInput: {
              id: editingDepartment.departmentId,
              departmentName: newDepartment.name,
              prefix: newDepartment.prefix,
            },
          },
        });

        const updatedDept = result.data?.updateDepartment;
        if (updatedDept) {
          setDepartments(
            departments.map((dept) =>
              dept.departmentId === editingDepartment.departmentId 
                ? { ...updatedDept, departmentId: editingDepartment.departmentId } 
                : dept
            )
          );
        }
      } catch (error) {
        alert("Failed to update department: " + error.message);
      }

      setEditingDepartment(null);
    } else {
      try {
        const result = await createDepartment({
          variables: {
            createDepartmentInput: {
              departmentName: newDepartment.name,
              prefix: newDepartment.prefix,
            },
          },
        });

        const createdDept = result.data?.createDepartment;
        if (createdDept) {
          setDepartments([...departments, createdDept]);
        }
      } catch (error) {
        alert("Failed to create department: " + error.message);
      }
    }

    setNewDepartment({ name: "", prefix: "" });
    setShowDepartmentForm(false);
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setNewDepartment({
      name: department.departmentName,
      prefix:
        department.prefix ||
        department.departmentName.slice(0, 4).toUpperCase(),
    });
    setShowDepartmentForm(true);
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await deleteDepartment({
          variables: { removeDepartmentId: departmentId },
        });
        setDepartments(departments.filter((dept) => dept.departmentId !== departmentId));
      } catch (error) {
        alert("Failed to delete department: " + error.message);
      }
    }
  };

  const handleCancelForm = () => {
    setShowDepartmentForm(false);
    setEditingDepartment(null);
    setNewDepartment({ name: "", prefix: "" });
  };

  return (
    <div className="departments-content">
      <div className="departments-header">
        <div className="header-content">
          <h2>Department Management</h2>
          <p className="header-subtitle">Organize and manage municipal departments</p>
        </div>
        <button
          onClick={() => setShowDepartmentForm(true)}
          className="add-department-btn"
        >
          <FaPlus className="btn-icon" />
          Add Department
        </button>
      </div>

      {showDepartmentForm && (
        <div className="department-form-overlay">
          <div className="department-form-modal">
            <div className="modal-header">
              <h3>
                {editingDepartment ? "Edit Department" : "Add New Department"}
              </h3>
              <button onClick={handleCancelForm} className="close-modal-btn">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddDepartment}>
              <div className="form-group">
                <label>Department Name</label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const prefix = name.slice(0, 4).toUpperCase();
                    setNewDepartment({
                      name: name,
                      prefix: prefix,
                    });
                  }}
                  placeholder="e.g., Waterworks, Assesor, Engineering"
                  required
                />
              </div>

              <div className="form-group">
                <label>Department Code</label>
                <input
                  type="text"
                  value={newDepartment.prefix}
                  placeholder="Auto-generated"
                  maxLength="4"
                  readOnly
                  className="readonly-input"
                />
                <small className="form-help">
                  Automatically generated from department name
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingDepartment ? "Update Department" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="departments-table-container">
        <div className="table-header">
          <div className="table-title">
            <h3>All Departments</h3>
            <span className="department-count">{departments.length} Total</span>
          </div>
        </div>

        <div className="departments-table">
          <table>
            <thead>
              <tr>
                <th>
                  <div className="th-content">
                    <HiOfficeBuilding className="th-icon" />
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
              {departments.map((department) => (
                <tr key={department.departmentId} className="table-row">
                  <td className="department-name-cell">
                    <div className="department-info">
                      <div className="department-avatar">
                        {department.departmentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="department-details">
                        <span className="department-name">
                          {department.departmentName}
                        </span>
                        <span className="department-code">
                          {department.prefix || department.departmentName.slice(0, 4).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div className="actions">
                      <button
                        onClick={() => handleEditDepartment(department)}
                        className="edit-btn"
                        title="Edit Department"
                      >
                        <FaEdit className="btn-icon" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(department.departmentId)}
                        className="delete-btn"
                        title="Delete Department"
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

          {departments.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <FaFolder className="empty-icon" />
              </div>
              <h3>No Departments Yet</h3>
              <p>Start organizing your municipal by creating departments</p>
              <button
                onClick={() => setShowDepartmentForm(true)}
                className="empty-state-btn"
              >
                <FaPlus className="btn-icon" />
                Create First Department
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageDepartment;