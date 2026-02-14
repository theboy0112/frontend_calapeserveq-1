import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Building2,
  Users,
  ChevronDown,
  ArrowRight,
  Loader2,
  RotateCcw,
  Check,
  ArrowLeft,
} from "lucide-react";
import "../Citizens/styles/QueueForm.css";
import QueueModal from "../Citizens/QueueModal";
import { GET_DEPARTMENTS, GET_SERVICES } from "../../graphql/query";
import { CREATE_QUEUE } from "../../graphql/mutation";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import ScrollHint from "../../components/ScrollHint/ScrollHint";
import { isOfficeHours, getOfficeHoursMessage } from "../../utils/officeHours";

import { useNavigate } from "react-router-dom";

const ClientQueue = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    departmentId: "",
    serviceId: "",
    priority: "",
  });

  const {
    data: departmentsData,
    loading: departmentsLoading,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useQuery(GET_DEPARTMENTS, {
    fetchPolicy: "network-only",
  });

  const {
    data: servicesData,
    loading: servicesLoading,
    error: servicesError,
    refetch: refetchServices,
  } = useQuery(GET_SERVICES, {
    fetchPolicy: "network-only",
  });

  // Real-time updates listener
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "dataUpdated") {
        refetchDepartments();
        refetchServices();
      }
    };

    const channel = new BroadcastChannel("admin-updates");

    channel.onmessage = (event) => {
      if (event.data.type === "DATA_UPDATED") {
        refetchDepartments();
        refetchServices();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      channel.close();
    };
  }, [refetchDepartments, refetchServices]);

  // Fixed department options with better data extraction
  const departmentOptions = useMemo(() => {
    let departments = [];

    if (departmentsData?.departments) {
      departments = Array.isArray(departmentsData.departments)
        ? departmentsData.departments
        : [];
    }

    if (departments.length === 0 && servicesData?.services) {
      const services = Array.isArray(servicesData.services)
        ? servicesData.services
        : [];
      const departmentMap = new Map();

      services.forEach((service) => {
        if (service?.department) {
          const dept = service.department;
          if (dept.departmentId && dept.departmentName) {
            departmentMap.set(dept.departmentId, {
              departmentId: dept.departmentId,
              departmentName: dept.departmentName,
            });
          }
        }
      });

      departments = Array.from(departmentMap.values());
    }

    return departments;
  }, [departmentsData, servicesData]);

  const [createQueue] = useMutation(CREATE_QUEUE, {
    onError: (error) => {
      console.error("Create queue mutation error:", error);
    },
  });

  const [queueNumber, setQueueNumber] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filteredServices, setFilteredServices] = useState([]);

  useEffect(() => {
    if (servicesData?.services && formData.departmentId) {
      const services = Array.isArray(servicesData.services)
        ? servicesData.services
        : [];
      const filtered = services.filter(
        (service) =>
          service?.department &&
          String(service.department.departmentId) ===
            String(formData.departmentId),
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices([]);
    }
  }, [formData.departmentId, servicesData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue =
      name === "departmentId" || name === "serviceId" ? value : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
      ...(name === "departmentId" && { serviceId: "" }),
    }));
    if (error) setError("");
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.departmentId) {
      setError("Please select a department");
      return;
    }
    if (currentStep === 2 && !formData.serviceId) {
      setError("Please select a service");
      return;
    }
    if (currentStep === 3 && !formData.priority) {
      setError("Please select a priority level");
      return;
    }

    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async () => {
    if (!isOfficeHours()) {
      setError(getOfficeHoursMessage());
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const selectedService = filteredServices.find(
        (service) => String(service.serviceId) === String(formData.serviceId),
      );

      const selectedDepartment = departmentOptions?.find(
        (dept) => String(dept.departmentId) === String(formData.departmentId),
      );

      if (!selectedService || !selectedDepartment) {
        throw new Error("Selected service or department not found");
      }

      const normalizedPriority =
        String(formData.priority).toLowerCase() === "priority"
          ? "senior/pwd/pregnant"
          : "regular";

      const createQueueInput = {
        departmentId: Number(formData.departmentId),
        serviceId: Number(formData.serviceId),
        priority: normalizedPriority,
      };

      const { data } = await createQueue({
        variables: { createQueueInput },
      });

      if (data?.createQueue) {
        setQueueNumber(data.createQueue);
        setShowModal(true);

        try {
          const deptId = Number(formData.departmentId);
          if (!Number.isNaN(deptId)) {
            const channel = new BroadcastChannel(`queue-${deptId}`);
            channel.postMessage({
              type: "NEW_QUEUE",
              data: {
                queueNumber: data.createQueue,
                departmentId: deptId,
                serviceId: Number(formData.serviceId),
                priority: normalizedPriority,
                status: "Waiting",
                createdAt: new Date().toISOString(),
              },
            });
            channel.close();
          }
        } catch (e) {
          console.warn("Broadcast channel not available:", e);
        }
      }
    } catch (error) {
      console.error("Error creating queue:", error);
      const gqlMsg =
        error?.graphQLErrors?.[0]?.message ||
        error?.networkError?.result?.errors?.[0]?.message ||
        error?.networkError?.message ||
        error?.message;
      setError(gqlMsg || "Failed to create queue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      departmentId: "",
      serviceId: "",
      priority: "",
    });
    setCurrentStep(1);
    setError("");
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Department Selection";
      case 2:
        return "Type of Service";
      case 3:
        return "Priority Level";
      case 4:
        return "Generate Queue Number";
      default:
        return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return "Choose the destination department";
      case 2:
        return "Select the type of service";
      case 3:
        return "Choose priority level";
      case 4:
        return "Review information and generate queue number";
      default:
        return "";
    }
  };

  const getSelectedDepartmentName = () => {
    const dept = departmentOptions?.find(
      (d) => String(d.departmentId) === String(formData.departmentId),
    );
    return dept?.departmentName || "Not selected";
  };

  const getSelectedServiceName = () => {
    const service = filteredServices.find(
      (s) => String(s.serviceId) === String(formData.serviceId),
    );
    return service?.serviceName || "Not selected";
  };

  if (departmentsLoading || servicesLoading) {
    return (
      <div className="queue-page-wrapper">
        <Header />
        <div className="queue-home-container">
          <div className="queue-loading-container">
            <Loader2 className="queue-spinner" size={32} />
            <p>Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (departmentsError || servicesError) {
    const errorMessage = departmentsError?.message || servicesError?.message;

    return (
      <div className="queue-page-wrapper">
        <Header />
        <div className="queue-home-container">
          <div className="queue-error-container">
            <div className="queue-error-message">
              <p>Error loading data: {errorMessage}</p>
              <button
                className="queue-retry-btn"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="queue-page-wrapper">
      <Header />
      <div className="queue-home-container">
        <div className="queue-top-section">
          <div className="queue-top-section-left">
            <button
              className="queue-previous-btn"
              onClick={() => navigate("/home")}
              style={{
                width: "fit-content",
                border: "none",
                background: "transparent",
                padding: "0.4rem 0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                color: "#475569",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
          </div>

          <div className="queue-top-section-center">
            <div className="queue-progress-container">
              <div className="queue-progress-steps">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`queue-progress-step ${currentStep >= step ? "queue-progress-step-active" : ""} ${currentStep > step ? "queue-progress-step-completed" : ""}`}
                  >
                    <div className="queue-step-circle">
                      {currentStep > step ? <Check size={14} /> : step}
                    </div>
                    <div className="queue-step-label">Step {step}</div>
                  </div>
                ))}
              </div>
              <div className="queue-progress-bar">
                <div
                  className="queue-progress-fill"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="queue-top-section-right">
            {/* Spacer for symmetry */}
          </div>
        </div>

        <div className="queue-form-container">
          <div className="queue-form-header">
            <div className="queue-form-title-section">
              <h2 className="queue-form-title">{getStepTitle()}</h2>
              <p className="queue-form-subtitle">{getStepSubtitle()}</p>
            </div>
          </div>

          <ScrollHint />

          <div className="queue-form-wrapper">
            {error && (
              <div className="queue-error-message">
                <p>{error}</p>
              </div>
            )}

            <div className="queue-form">
              <div className="queue-form-slides">
                {currentStep === 1 && (
                  <div className="queue-form-slide queue-form-slide-active">
                    <div className="queue-form-section">
                      <div className="queue-section-header">
                        <h3>
                          <Building2 className="queue-section-icon" size={20} />
                          Select Department
                        </h3>
                      </div>

                      <div className="queue-form-group">
                        <label htmlFor="departmentId">Department</label>
                        <div className="queue-select-wrapper">
                          <select
                            id="departmentId"
                            name="departmentId"
                            value={formData.departmentId}
                            onChange={handleChange}
                            required
                            className="queue-form-select"
                            disabled={departmentsLoading}
                          >
                            <option value="" disabled>
                              {departmentsLoading
                                ? "Loading departments..."
                                : "-- Select Department --"}
                            </option>
                            {departmentOptions?.map((dept) => (
                              <option
                                key={dept.departmentId}
                                value={dept.departmentId}
                              >
                                {dept.departmentName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            className="queue-select-arrow"
                            size={14}
                          />
                        </div>
                        {departmentOptions?.length === 0 &&
                          !departmentsLoading && (
                            <p className="queue-no-data-message">
                              No departments available
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="queue-form-slide queue-form-slide-active">
                    <div className="queue-form-section">
                      <div className="queue-section-header">
                        <h3>
                          <Users className="queue-section-icon" size={20} />
                          Type of Service
                        </h3>
                      </div>

                      <div className="queue-form-group">
                        <label htmlFor="serviceId">Service Type</label>
                        <div className="queue-select-wrapper">
                          <select
                            id="serviceId"
                            name="serviceId"
                            value={formData.serviceId}
                            onChange={handleChange}
                            required
                            className="queue-form-select"
                            disabled={servicesLoading || !formData.departmentId}
                          >
                            <option value="" disabled>
                              {!formData.departmentId
                                ? "Please select a department first"
                                : servicesLoading
                                  ? "Loading services..."
                                  : "-- Select Service Type --"}
                            </option>
                            {filteredServices.map((service) => (
                              <option
                                key={service.serviceId}
                                value={service.serviceId}
                              >
                                {service.serviceName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            className="queue-select-arrow"
                            size={14}
                          />
                        </div>
                        {filteredServices.length === 0 &&
                          formData.departmentId &&
                          !servicesLoading && (
                            <p className="queue-no-data-message">
                              No services available for this department
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="queue-form-slide queue-form-slide-active">
                    <div className="queue-form-section">
                      <div className="queue-section-header">
                        <h3>
                          <Users className="queue-section-icon" size={20} />
                          Priority Level
                        </h3>
                      </div>

                      <div className="queue-form-group">
                        <label htmlFor="priority">Priority Level</label>
                        <div className="queue-select-wrapper">
                          <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            required
                            className="queue-form-select"
                          >
                            <option value="" disabled>
                              -- Select Priority --
                            </option>
                            <option value="Regular">Regular</option>
                            <option value="Priority">
                              Priority (Senior/PWD/Pregnant)
                            </option>
                          </select>
                          <ChevronDown
                            className="queue-select-arrow"
                            size={14}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="queue-form-slide queue-form-slide-active">
                    <div className="queue-form-section">
                      <div className="queue-section-header">
                        <h3>Review Your Information</h3>
                      </div>

                      <div className="queue-review-info">
                        <div className="queue-review-item">
                          <strong>Department:</strong>
                          <span>{getSelectedDepartmentName()}</span>
                        </div>
                        <div className="queue-review-item">
                          <strong>Service Type:</strong>
                          <span>{getSelectedServiceName()}</span>
                        </div>
                        <div className="queue-review-item">
                          <strong>Priority Level:</strong>
                          <span>{formData.priority}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="queue-form-actions">
                <div className="queue-actions-left">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      className="queue-previous-btn"
                      onClick={handlePrevious}
                      disabled={isSubmitting}
                    >
                      <ArrowLeft size={16} />
                      Previous
                    </button>
                  )}
                </div>

                <div className="queue-actions-center">
                  {currentStep >= 2 && (
                    <button
                      type="button"
                      className="queue-reset-btn"
                      onClick={resetForm}
                      disabled={isSubmitting}
                    >
                      <RotateCcw size={16} />
                      Reset
                    </button>
                  )}
                </div>

                <div className="queue-actions-right">
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      className="queue-next-btn"
                      onClick={handleNext}
                      disabled={isSubmitting}
                    >
                      Next
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`queue-submit-btn ${isSubmitting ? "queue-submit-btn-loading" : ""}`}
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                    >
                      {!isSubmitting ? (
                        <>
                          <span>Generate Queue Number</span>
                          <ArrowRight size={18} />
                        </>
                      ) : (
                        <>
                          <Loader2 className="queue-spinner" size={18} />
                          <span>Processing...</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showModal && (
            <QueueModal
              queueNumber={queueNumber}
              department={getSelectedDepartmentName()}
              onClose={() => {
                setShowModal(false);
                resetForm();
              }}
            />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ClientQueue;
