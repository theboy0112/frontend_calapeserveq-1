import React, { useState, useEffect } from "react";
import "./styles/ManageServices.css";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_SERVICE,
  UPDATE_SERVICE,
  DELETE_SERVICE,
} from "../../graphql/mutation";
import { GET_SERVICES, GET_DEPARTMENTS } from "../../graphql/query";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaConciergeBell,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { MdMiscellaneousServices } from "react-icons/md";
import { HiOfficeBuilding } from "react-icons/hi";
import Swal from "sweetalert2";

const ManageServices = () => {
  const [services, setServices] = useState([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({
    serviceName: "",
    departmentId: "",
  });
  const [collapsedDepartments, setCollapsedDepartments] = useState(new Set());

  const { data: servicesData, refetch: refetchServices } =
    useQuery(GET_SERVICES);
  const { data: departmentsData } = useQuery(GET_DEPARTMENTS);

  const [createService] = useMutation(CREATE_SERVICE, {
    onCompleted: () => {
      refetchServices();
    },
  });

  const [updateService] = useMutation(UPDATE_SERVICE, {
    onCompleted: () => {
      refetchServices();
    },
  });

  const [deleteService] = useMutation(DELETE_SERVICE, {
    onCompleted: () => {
      refetchServices();
    },
  });

  useEffect(() => {
    if (servicesData && servicesData.services) {
      setServices(servicesData.services);
    }
  }, [servicesData]);

  const groupedServices = services.reduce((acc, service) => {
    const deptId = service.department?.departmentId || "unassigned";
    const deptName =
      service.department?.departmentName || "Unassigned Department";

    if (!acc[deptId]) {
      acc[deptId] = {
        departmentId: deptId,
        departmentName: deptName,
        services: [],
      };
    }
    acc[deptId].services.push(service);
    return acc;
  }, {});

  const departmentGroups = Object.values(groupedServices).sort((a, b) => {
    if (a.departmentId === "unassigned") return 1;
    if (b.departmentId === "unassigned") return -1;
    return a.departmentName.localeCompare(b.departmentName);
  });

  const toggleDepartment = (deptId) => {
    setCollapsedDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
      } else {
        newSet.add(deptId);
      }
      return newSet;
    });
  };

  const handleAddService = async (e) => {
    e.preventDefault();

    if (editingService) {
      try {
        await updateService({
          variables: {
            updateServiceInput: {
              serviceId: editingService.serviceId,
              serviceName: newService.serviceName,
              departmentId: parseInt(newService.departmentId),
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
      setEditingService(null);
    } else {
      try {
        await createService({
          variables: {
            createServiceInput: {
              serviceName: newService.serviceName,
              departmentId: parseInt(newService.departmentId),
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

    setNewService({ serviceName: "", departmentId: "" });
    setShowServiceForm(false);
  };

const handleEditService = async (service) => {
  const result = await Swal.fire({
    title: "Edit Service?",
    text: `Do you want to edit "${service.serviceName}"?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, edit it!",
    cancelButtonText: "Cancel",
  });

  if (result.isConfirmed) {
    try {
      setEditingService(service);
      setNewService({
        serviceName: service.serviceName,
        departmentId: service.department?.departmentId || "",
      });
      setShowServiceForm(true);

      
      Swal.fire({
        icon: "success",
        title: "Editing Mode Activated!",
        text: "You can now update this service’s details.",
        confirmButtonColor: "#3085d6",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong while preparing the edit form!",
      });
    }
  }
};



  const handleDeleteService = async (serviceId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This service will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteService({
          variables: { serviceId: serviceId },
        });

        setServices(
          services.filter((service) => service.serviceId !== serviceId)
        );

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "The service has been successfully deleted.",
          confirmButtonColor: "#3085d6",
        });
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong while deleting the service!",
        });
      }
    }
  };

  const handleCancelForm = () => {
    setShowServiceForm(false);
    setEditingService(null);
    setNewService({ serviceName: "", departmentId: "" });
  };

  return (
    <div className="services-content">
      <div className="services-header">
        <div className="header-content">
          <h2>Service Management</h2>
          <p className="header-subtitle">
            Manage municipal services organized by department
          </p>
        </div>
        <button
          onClick={() => setShowServiceForm(true)}
          className="add-service-btn"
        >
          <FaPlus className="btn-icon" />
          Add Service
        </button>
      </div>

      {showServiceForm && (
        <div className="service-form-overlay">
          <div className="service-form-modal">
            <div className="modal-header">
              <h3>{editingService ? "Edit Service" : "Add New Service"}</h3>
              <button onClick={handleCancelForm} className="close-modal-btn">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddService}>
              <div className="form-group">
                <label>Type of Service</label>
                <input
                  type="text"
                  value={newService.serviceName}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      serviceName: e.target.value,
                    })
                  }
                  placeholder="e.g., Building Permit, Business License, Water Connection"
                  required
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  value={newService.departmentId}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      departmentId: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select Department</option>
                  {departmentsData?.departments?.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
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
                  {editingService ? "Update Service" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="services-table-container">
        <div className="table-header">
          <div className="table-title">
            <h3>All Services</h3>
            <span className="service-count">{services.length} Total</span>
          </div>
        </div>

        <div className="services-grouped">
          {departmentGroups.length > 0 ? (
            departmentGroups.map((group) => (
              <div key={group.departmentId} className="department-group">
                <div
                  className="department-header"
                  onClick={() => toggleDepartment(group.departmentId)}
                >
                  <div className="department-info">
                    <HiOfficeBuilding className="department-icon" />
                    <h3 className="department-name">{group.departmentName}</h3>
                    <span className="service-badge">
                      {group.services.length}{" "}
                      {group.services.length === 1 ? "Service" : "Services"}
                    </span>
                  </div>
                  <button className="collapse-btn">
                    {collapsedDepartments.has(group.departmentId) ? (
                      <FaChevronDown />
                    ) : (
                      <FaChevronUp />
                    )}
                  </button>
                </div>

                {!collapsedDepartments.has(group.departmentId) && (
                  <div className="services-list">
                    <table>
                      <thead>
                        <tr>
                          <th>
                            <div className="th-content">
                              <MdMiscellaneousServices className="th-icon" />
                              Type of Service
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
                        {group.services.map((service) => (
                          <tr key={service.serviceId} className="table-row">
                            <td className="service-type-cell">
                              <div className="service-info">
                                <div className="service-icon">
                                  <FaConciergeBell />
                                </div>
                                <div className="service-details">
                                  <span className="service-name">
                                    {service.serviceName}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="actions-cell">
                              <div className="actions">
                                <button
                                  onClick={() => handleEditService(service)}
                                  className="edit-btn"
                                  title="Edit Service"
                                >
                                  <FaEdit className="btn-icon" />
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteService(service.serviceId)
                                  }
                                  className="delete-btn"
                                  title="Delete Service"
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
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <FaConciergeBell className="empty-icon" />
              </div>
              <h3>No Services Yet</h3>
              <p>Start by adding services to your municipal system</p>
              <button
                onClick={() => setShowServiceForm(true)}
                className="empty-state-btn"
              >
                <FaPlus className="btn-icon" />
                Create First Service
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageServices;
