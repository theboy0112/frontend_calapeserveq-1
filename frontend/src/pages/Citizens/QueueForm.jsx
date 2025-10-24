import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useMemo } from "react";
import {
  ArrowLeft,
  Building2,
  Users,
  ChevronDown,
  ArrowRight,
  Loader2,
  RotateCcw,
  Check,
} from "lucide-react";
import "./styles/QueueForm.css";
import QueueModal from "./QueueModal";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useNavigate } from "react-router-dom";
import { GET_DEPARTMENTS, GET_SERVICES } from "../../graphql/query";
import { CREATE_QUEUE } from "../../graphql/mutation";

const QueueForm = ({ onBack }) => {
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
} = useQuery(GET_DEPARTMENTS, {
  fetchPolicy: "network-only",
});

  const {
    data: servicesData,
    loading: servicesLoading,
    error: servicesError,
  } = useQuery(GET_SERVICES, {
    fetchPolicy: "network-only",
    onError: (e) => {
      console.error("Services query error:", e);
      if (e?.graphQLErrors?.length) console.error("GQL errors:", e.graphQLErrors);
      if (e?.networkError) console.error("Network error:", e.networkError);
    },
  });

  const departmentOptions = useMemo(() => {
    const direct = Array.isArray(departmentsData?.departments)
      ? departmentsData.departments
      : null;
    if (direct && direct.length) return direct;

    const services = Array.isArray(servicesData?.services)
      ? servicesData.services
      : [];
    const map = new Map();
    for (const s of services) {
      if (s?.department?.departmentId && s?.department?.departmentName) {
        map.set(s.department.departmentId, {
          departmentId: s.department.departmentId,
          departmentName: s.department.departmentName,
        });
      }
    }
    return Array.from(map.values());
  }, [departmentsData, servicesData]);

  const [createQueue] = useMutation(CREATE_QUEUE);

  const [queueNumber, setQueueNumber] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filteredServices, setFilteredServices] = useState([]);

  useEffect(() => {
    if (servicesData?.services && formData.departmentId) {
      const filtered = servicesData.services.filter(
        (service) =>
          String(service.department.departmentId) ===
          String(formData.departmentId)
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices([]);
    }
  }, [formData.departmentId, servicesData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue =
      name === "departmentId" || name === "serviceId"
        ? parseInt(value, 10)
        : value;

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
    setIsSubmitting(true);
    setError("");

    try {
      const selectedService = filteredServices.find(
        (service) => String(service.serviceId) === String(formData.serviceId)
      );

      const selectedDepartment = departmentOptions?.find(
        (dept) => String(dept.departmentId) === String(formData.departmentId)
      );

      if (!selectedService || !selectedDepartment) {
        throw new Error("Selected service or department not found");
      }

      const normalizedPriority =
        String(formData.priority).toLowerCase() === "priority" ? "senior/pwd/pregnant" : "regular";

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
        return "Choose your destination municipal department";
      case 2:
        return "Select the type of service you need";
      case 3:
        return "Choose your priority level";
      case 4:
        return "Review your information and generate queue number";
      default:
        return "";
    }
  };

  const getSelectedDepartmentName = () => {
    const dept = departmentOptions?.find(
      (d) => d.departmentId === formData.departmentId
    );
    return dept?.departmentName || "";
  };

  const getSelectedServiceName = () => {
    const service = filteredServices.find(
      (s) => s.serviceId === formData.serviceId
    );
    return service?.serviceName || "";
  };

  const hasDeptArray = Array.isArray(departmentsData?.departments);
  const hasServicesArray = Array.isArray(servicesData?.services);
  if (!departmentsLoading && !servicesLoading && !hasDeptArray && !hasServicesArray) {
    return (
      <div className="home-container">
        <Header />
        <div className="error-message">
          <p>Error loading data. Please refresh the page.</p>
          <p>
            {(departmentsError?.graphQLErrors?.[0]?.message || departmentsError?.message ||
              servicesError?.graphQLErrors?.[0]?.message || servicesError?.message) ?? ""}
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="home-container">
      <Header />
      <div className="back-btn-container">
        <button className="back-btn-header" onClick={() => navigate("/home")}>
          <ArrowLeft className="back-icon" size={18} />
          Back to Home
        </button>
      </div>

      <div className="queue-form-container">
        <div className="form-header">
          <div className="progress-container">
            <div className="progress-steps">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`progress-step ${currentStep >= step ? "active" : ""} ${currentStep > step ? "completed" : ""}`}
                >
                  <div className="step-circle">
                    {currentStep > step ? <Check size={14} /> : step}
                  </div>
                  <div className="step-label">Step {step}</div>
                </div>
              ))}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="form-title-section">
            <h2 className="form-title">{getStepTitle()}</h2>
            <p className="form-subtitle">{getStepSubtitle()}</p>
          </div>
        </div>

        <div className="form-wrapper">
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="queue-form">
            <div className="form-slides">
              {currentStep === 1 && (
                <div className="form-slide active">
                  <div className="form-section">
                    <div className="section-header">
                      <h3>
                        <Building2 className="section-icon" size={20} />
                        Select Department
                      </h3>
                    </div>

                    <div className="form-group">
                      <label htmlFor="departmentId">Department</label>
                      <div className="select-wrapper">
                        <select
                          id="departmentId"
                          name="departmentId"
                          value={formData.departmentId}
                          onChange={handleChange}
                          required
                          className="form-select"
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
                        <ChevronDown className="select-arrow" size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="form-slide active">
                  <div className="form-section">
                    <div className="section-header">
                      <h3>
                        <Users className="section-icon" size={20} />
                        Type of Service
                      </h3>
                    </div>

                    <div className="form-group">
                      <label htmlFor="serviceId">Service Type</label>
                      <div className="select-wrapper">
                        <select
                          id="serviceId"
                          name="serviceId"
                          value={formData.serviceId}
                          onChange={handleChange}
                          required
                          className="form-select"
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
                        <ChevronDown className="select-arrow" size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="form-slide active">
                  <div className="form-section">
                    <div className="section-header">
                      <h3>
                        <Users className="section-icon" size={20} />
                        Priority Level
                      </h3>
                    </div>

                    <div className="form-group">
                      <label htmlFor="priority">Priority Level</label>
                      <div className="select-wrapper">
                        <select
                          id="priority"
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          required
                          className="form-select"
                        >
                          <option value="" disabled>
                            -- Select Priority --
                          </option>
                          <option value="Regular">Regular</option>
                          <option value="Priority">
                            Priority (Senior/PWD/Pregnant)
                          </option>
                        </select>
                        <ChevronDown className="select-arrow" size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="form-slide active">
                  <div className="form-section">
                    <div className="section-header">
                      <h3>Review Your Information</h3>
                    </div>

                    <div className="review-info">
                      <div className="review-item">
                        <strong>Department:</strong>
                        <span>{getSelectedDepartmentName()}</span>
                      </div>
                      <div className="review-item">
                        <strong>Service Type:</strong>
                        <span>{getSelectedServiceName()}</span>
                      </div>
                      <div className="review-item">
                        <strong>Priority Level:</strong>
                        <span>{formData.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="previous-btn"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>
              )}

              {currentStep < 4 ? (
                <button type="button" className="next-btn" onClick={handleNext}>
                  Next
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className={`submit-btn ${isSubmitting ? "loading" : ""}`}
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
                      <Loader2 className="spinner" size={18} />
                      <span>Processing...</span>
                    </>
                  )}
                </button>
              )}

              <button type="button" className="reset-btn" onClick={resetForm}>
                <RotateCcw size={16} />
                Reset
              </button>
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

      <Footer />
    </div>
  );
};

export default QueueForm;
