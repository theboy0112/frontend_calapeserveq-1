import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  LogOut,
  RotateCcw,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Settings,
  User,
  ChevronDown,
  Plus,
  X,
  Loader2,
  Ban,
} from "lucide-react";
import "./styles/StaffDashboard.css";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_QUEUES_BY_DEPARTMENT,
  GET_STAFF_PROFILE,
  GET_QUEUESTAFF_PROFILE,
} from "../../graphql/query";
import {
  UPDATE_QUEUE_STATUS,
  CALL_NEXT_REPEAT,
  CALL_NEXT,
} from "../../graphql/mutation";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import QueueForm from "../Citizens/QueueForm";
import Settingspage from "./Settingspage";
import ScrollHint from "../../components/ScrollHint/ScrollHint";
import { logoutPreservingRoleData } from "../../utils/logoutHelper";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [currentServing, setCurrentServing] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statistics, setStatistics] = useState({
    waiting: 0,
    serving: 0,
    served: 0,
    void: 0,
  });
  const [queueList, setQueueList] = useState([]);
  const [queuesByDepartment, setQueuesByDepartment] = useState([]);
  const [notification, setNotification] = useState(null);
  const [departmentInfo, setDepartmentInfo] = useState({
    name: "Loading...",
    prefix: "",
    id: null,
  });
  const [staffInfo, setStaffInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCallLoading, setIsCallLoading] = useState(false);
  const [callingPriority, setCallingPriority] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQueueForm, setShowQueueForm] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [profileFetchCompleted, setProfileFetchCompleted] = useState(false);
  const speechSynthRef = useRef(null);
  const notificationSoundRef = useRef(null);
  const userMenuRef = useRef(null);

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const channel = new BroadcastChannel("theme-updates");
    channel.onmessage = (event) => {
      if (event.data.type === "THEME_CHANGED") {
        document.documentElement.setAttribute("data-theme", event.data.theme);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    const createNotificationSound = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        volume * 0.3,
        audioContext.currentTime + 0.01,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      return { oscillator, gainNode };
    };

    notificationSoundRef.current = createNotificationSound;

    if ("speechSynthesis" in window) {
      speechSynthRef.current = window.speechSynthesis;
    }

    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, [volume]);

  const playNotificationSound = () => {
    if (!audioEnabled) return;
    try {
      if (notificationSoundRef.current) {
        notificationSoundRef.current();
      }
    } catch (error) {
      console.error("Audio error:", error);
    }
  };

  const speakText = (text, callback) => {
    if (!audioEnabled || !speechSynthRef.current) {
      if (callback) callback();
      return;
    }

    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices = speechSynthRef.current.getVoices();
    const englishVoice =
      voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.includes("Google") || voice.name.includes("Microsoft")),
      ) || voices.find((voice) => voice.lang.startsWith("en"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };

    speechSynthRef.current.speak(utterance);
  };

  const announceCurrentServing = (queueNumber, isRepeat = false) => {
    if (!audioEnabled) return;

    const message = isRepeat
      ? `Calling again, ${queueNumber}. Please proceed to the window.`
      : `Now serving ${queueNumber}. Please proceed to the window.`;

    playNotificationSound();
    setTimeout(() => {
      speakText(message);
    }, 300);
  };

  const {
    data: profileData,
    loading: profileLoading,
    error: profileError,
  } = useQuery(
    currentRole === "queuestaff" ? GET_QUEUESTAFF_PROFILE : GET_STAFF_PROFILE,
    {
      variables: {
        staffId: parseInt(
          sessionStorage.getItem("staffId") ||
            localStorage.getItem("staffId") ||
            localStorage.getItem("queueStaffId"),
        ),
      },
      skip:
        !sessionStorage.getItem("staffId") &&
        !localStorage.getItem("staffId") &&
        !localStorage.getItem("queueStaffId"),
      fetchPolicy: "network-only",
      onCompleted: (data) => {
        if (data.staff) {
          const staff = data.staff;
          const updatedStaffInfo = {
            ...staffInfo,
            id: staff.staffId,
            username: staff.staffUsername,
            firstName: staff.staffFirstname,
            lastName: staff.staffLastname,
            counter: staff.counter,
          };
          setStaffInfo(updatedStaffInfo);

          // Also update the departmental info in case it's missing
          if (staff.department) {
            setDepartmentInfo({
              id: parseInt(staff.department.departmentId),
              name: staff.department.departmentName,
              prefix: staff.department.prefix || "",
            });
          }

          setProfileFetchCompleted(true);
        }
      },
    },
  );

  const {
    data: queueQueryData,
    loading: queueLoading,
    error: queueError,
    refetch: refetchQueues,
  } = useQuery(GET_QUEUES_BY_DEPARTMENT, {
    variables: { departmentId: departmentInfo.id },
    skip: !departmentInfo.id || isLoading || !profileFetchCompleted,
    fetchPolicy: "cache-and-network",
    pollInterval: 5000,
    onError: (err) => {
      console.error("GraphQL Error Details:", {
        message: err.message,
        graphQLErrors: err.graphQLErrors,
        networkError: err.networkError,
        extraInfo: err.extraInfo,
      });
    },
  });

  useEffect(() => {
    if (queueQueryData && queueQueryData.QueueByDepartment) {
      setQueuesByDepartment(queueQueryData.QueueByDepartment);
    } else {
      setQueuesByDepartment([]);
    }
  }, [queueQueryData]);

  const [updateQueueStatus] = useMutation(UPDATE_QUEUE_STATUS, {
    onCompleted: (data) => {
      refetchQueues();
    },
    onError: (error) => {
      console.error("Update queue error:", error);
      showNotification("Failed to update queue status", "error");
    },
    refetchQueries: [
      {
        query: GET_QUEUES_BY_DEPARTMENT,
        variables: { departmentId: departmentInfo.id },
      },
    ],
    awaitRefetchQueries: true,
  });

  const [callNextRepeat] = useMutation(CALL_NEXT_REPEAT, {
    onCompleted: (data) => {
      refetchQueues();
      // Backend automatically sets status to VOID if count >= 3
      if (data.callNextRepeat.status === "VOID") {
        showNotification("Ticket voided due to max repeats", "info");
        setCurrentServing(null);
      }
    },
    onError: (error) => {
      console.error("Repeat call error:", error);
      showNotification("Failed to repeat call", "error");
    },
    refetchQueries: [
      {
        query: GET_QUEUES_BY_DEPARTMENT,
        variables: { departmentId: departmentInfo.id },
      },
    ],
  });

  const [callNext] = useMutation(CALL_NEXT, {
    onCompleted: (data) => {
      if (data.callNext) {
        const queueNumber = `${departmentInfo.prefix}-${data.callNext.number}`;
        showNotification(`Now serving ${queueNumber}`);
        announceCurrentServing(queueNumber, false);
      } else {
        showNotification("No citizens in queue", "warning");
      }
      refetchQueues();
    },
    onError: (error) => {
      console.error("Call next error:", error);
      showNotification(error.message || "Failed to call next citizen", "error");
    },
    refetchQueries: [
      {
        query: GET_QUEUES_BY_DEPARTMENT,
        variables: { departmentId: departmentInfo.id },
      },
    ],
  });

  useEffect(() => {
    if (Array.isArray(queuesByDepartment) && queuesByDepartment.length > 0) {
      const currentCounterId = staffInfo?.counter?.counterId;

      const waitingCount = queuesByDepartment.filter(
        (queue) => queue.status?.toLowerCase() === "waiting",
      ).length;

      const servingCount = queuesByDepartment.filter(
        (queue) =>
          queue.status?.toLowerCase() === "serving" &&
          queue.counter?.counterId === currentCounterId,
      ).length;

      const servedCount = queuesByDepartment.filter(
        (queue) =>
          (queue.status?.toLowerCase() === "complete" ||
            queue.status?.toLowerCase() === "completed") &&
          queue.counter?.counterId === currentCounterId,
      ).length;

      const voidCount = queuesByDepartment.filter(
        (queue) =>
          queue.status?.toLowerCase() === "void" &&
          queue.counter?.counterId === currentCounterId,
      ).length;

      setStatistics({
        waiting: waitingCount,
        serving: servingCount,
        served: servedCount,
        void: voidCount,
      });
    } else {
      setStatistics({
        waiting: 0,
        serving: 0,
        served: 0,
        void: 0,
      });
    }
  }, [queuesByDepartment, staffInfo?.counter?.counterId]);

  useEffect(() => {
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");
    const role =
      sessionStorage.getItem("userRole") || localStorage.getItem("role");

    let staffData = null;

    const sessionStaffInfo = sessionStorage.getItem("staffInfo");
    if (sessionStaffInfo) {
      try {
        staffData = JSON.parse(sessionStaffInfo);
        console.log("Using staff data from sessionStorage:", staffData);
      } catch (e) {
        console.error("Error parsing sessionStorage staffInfo:", e);
      }
    }

    if (!staffData) {
      const localStaffInfo = localStorage.getItem("staffInfo");
      if (localStaffInfo) {
        try {
          staffData = JSON.parse(localStaffInfo);
          console.log(
            "Falling back to staff data from localStorage:",
            staffData,
          );
        } catch (e) {
          console.error("Error parsing localStorage staffInfo:", e);
        }
      }
    }

    if (!staffData) {
      const staffId = localStorage.getItem("staffId");
      const staffUsername = localStorage.getItem("staffUsername");
      const staffDepartment = localStorage.getItem("staffDepartment");
      const staffDepartmentId = localStorage.getItem("staffDepartmentId");
      const staffDepartmentPrefix = localStorage.getItem(
        "staffDepartmentPrefix",
      );

      if (staffId && staffUsername) {
        staffData = {
          id: staffId,
          username: staffUsername,
          department: {
            id: staffDepartmentId ? parseInt(staffDepartmentId) : 0,
            name: staffDepartment || "",
            prefix: staffDepartmentPrefix || "",
          },
          counter: localStorage.getItem("staffCounterId")
            ? {
                counterId: parseInt(localStorage.getItem("staffCounterId")),
                counterName: localStorage.getItem("staffCounterName") || "",
              }
            : null,
        };
      }
    }

    if (!staffData) {
      console.error("No staff data found in any storage");
      showNotification("No staff information found. Please login.", "warning");
      handleRedirectToLogin();
      return;
    }

    const department = staffData.department;

    if (
      !department ||
      !department.id ||
      !department.name ||
      !department.prefix
    ) {
      console.error("Invalid department info:", department);
      showNotification(
        "Invalid department information. Please login again.",
        "error",
      );
      handleRedirectToLogin();
      return;
    }

    const deptId = parseInt(department.id);
    if (isNaN(deptId)) {
      console.error("Invalid department ID:", department.id);
      showNotification("Invalid department ID. Please login again.", "error");
      handleRedirectToLogin();
      return;
    }

    setStaffInfo(staffData);
    setDepartmentInfo({
      name: department.name.trim(),
      prefix: department.prefix.trim(),
      id: deptId,
    });
    setIsLoading(false);
    setCurrentRole(role);
  }, []);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Transform queue data
  useEffect(() => {
    if (queuesByDepartment?.length) {
      const currentCounterId = staffInfo?.counter?.counterId;

      const transformed = queuesByDepartment.map((q) => ({
        id: q.queueId,
        queueId: q.queueId,
        number: q.number,
        type: q.service?.serviceName || "Standard Service",
        priority: q.priority,
        status: q.status,
        repeatCount: q.repeatCount,
        createdAt: q.createdAt,
        displayNumber: `${departmentInfo.prefix}-${q.number || ""}`,
        department: q.department,
        service: q.service,
        counter: q.counter,
      }));

      const activeQueues = transformed.filter(
        (q) =>
          q.status?.toLowerCase() === "waiting" ||
          (q.status?.toLowerCase() === "serving" &&
            q.counter?.counterId === currentCounterId),
      );

      setQueueList(activeQueues);

      const currentServingQueue = transformed.find(
        (q) =>
          q.status?.toLowerCase() === "serving" &&
          q.counter?.counterId === currentCounterId,
      );

      if (currentServingQueue) {
        setCurrentServing(currentServingQueue.queueId);
      } else {
        setCurrentServing(null);
      }
    } else {
      setQueueList([]);
      setCurrentServing(null);
    }
  }, [
    queuesByDepartment,
    departmentInfo.prefix,
    staffInfo?.counter?.counterId,
  ]);

  useEffect(() => {
    if (queueError) {
      console.error("Queue query error:", queueError);
      if (
        queueError.graphQLErrors?.some(
          (error) =>
            error.message.includes("Unauthorized") ||
            error.message.includes("Invalid token") ||
            error.extensions?.code === "UNAUTHENTICATED",
        )
      ) {
        showNotification("Session expired. Please login again.", "error");
        handleRedirectToLogin();
      } else {
        showNotification("Failed to load queue data", "error");
      }
    }
  }, [queueError]);

  // Broadcast channel for real-time updates
  useEffect(() => {
    if (!departmentInfo.id || isLoading) return;

    const channel = new BroadcastChannel(`queue-${departmentInfo.id}`);
    channel.onmessage = (event) => {
      if (event.data.type === "NEW_QUEUE") {
        showNotification(`New queue: ${event.data.data.queueNumber}`, "info");
        playNotificationSound();
        refetchQueues();
      }
    };
    return () => channel.close();
  }, [departmentInfo.id, isLoading, audioEnabled]);

  const handleRedirectToLogin = () => {
    sessionStorage.clear();
    localStorage.clear();
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1000);
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCallNext = async (priority) => {
    if (!staffInfo?.counter?.counterId) {
      showNotification("No counter assigned to your profile", "error");
      return;
    }

    setIsCallLoading(true);

    try {
      // 1. Complete the current serving ticket if exists
      const currentServingCustomer = queuesByDepartment.find(
        (item) =>
          item.status?.toLowerCase() === "serving" &&
          item.counter?.counterId === staffInfo.counter.counterId,
      );

      if (currentServingCustomer?.queueId) {
        await updateQueueStatus({
          variables: {
            updateQueueInput: {
              queueId: parseInt(currentServingCustomer.queueId),
              status: "Complete",
            },
          },
        });
      }

      // 2. Call next from backend
      const vars = {
        staffId: parseInt(staffInfo.id),
        counterId: parseInt(staffInfo.counter.counterId),
        departmentId: parseInt(departmentInfo.id),
      };

      await callNext({
        variables: vars,
      });
    } catch (error) {
      console.error("Call next error:", error);
    } finally {
      setIsCallLoading(false);
    }
  };

  const handleRepeatCall = async () => {
    const servingCustomer = queuesByDepartment.find(
      (item) => item.status?.toLowerCase() === "serving",
    );

    if (servingCustomer) {
      try {
        await callNextRepeat({
          variables: {
            queueId: parseInt(servingCustomer.queueId),
          },
        });

        const queueNumber = `${departmentInfo.prefix}-${servingCustomer.number}`;
        showNotification(`Repeating call for ${queueNumber}`, "info");
        announceCurrentServing(queueNumber, true);
      } catch (error) {
        console.error("Error repeating call:", error);
      }
    } else {
      showNotification("No citizen currently being served", "warning");
    }
  };

  const handleVoid = async () => {
    if (!currentServing) return;

    try {
      await updateQueueStatus({
        variables: {
          updateQueueInput: {
            queueId: parseInt(currentServing),
            status: "Void",
          },
        },
      });
      showNotification("Ticket voided", "info");
      setCurrentServing(null);
    } catch (error) {
      console.error("Void error:", error);
      showNotification("Failed to void ticket", "error");
    }
  };

  const handleLogout = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    // Use the logout helper that preserves role-specific data
    logoutPreservingRoleData();
    navigate("/login", { replace: true });
  };

  const handleManageSettings = () => {
    setShowUserMenu(false);
    setShowSettings(true);
  };

  const handleQueueFormSuccess = () => {
    setShowQueueForm(false);
    refetchQueues();
    showNotification("Queue created successfully!", "success");
  };

  if (isLoading || queueLoading) {
    return (
      <div className="staff-dashboard-container">
        <Header />
        <div className="staff-panel">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="staff-dashboard-wrapper">
      <Header />

      <div className="staff-dashboard-container">
        <div className="staff-panel">
          {notification && (
            <div className={`notification ${notification.type}`}>
              <div className="notification-content">
                {notification.type === "success" && <CheckCircle size={18} />}
                {notification.type === "warning" && <AlertCircle size={18} />}
                {notification.type === "info" && <Bell size={18} />}
                {notification.type === "error" && <AlertCircle size={18} />}
                <span>{notification.message}</span>
              </div>
            </div>
          )}

          <div className="header">
            <div className="header-left">
              <h1 className="dashboard-title">
                {departmentInfo.name}
                {staffInfo?.counter?.counterName && (
                  <span className="counter-name-inline">
                    {" "}
                    | {staffInfo.counter.counterName}
                  </span>
                )}
              </h1>
              <div className="current-time">
                <Clock size={14} />
                <span>{currentTime.toLocaleTimeString()}</span>
                <span>•</span>
                <span>{currentTime.toLocaleDateString()}</span>
              </div>
            </div>

            <div className="user-profile" ref={userMenuRef}>
              <button
                className="user-profile-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  <User size={18} />
                </div>
                <div className="user-info">
                  <span className="user-name">
                    {staffInfo?.username || "Staff User"}
                  </span>
                  <span className="user-role">staff</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`chevron ${showUserMenu ? "rotate" : ""}`}
                />
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <button
                    className="dropdown-item"
                    onClick={handleManageSettings}
                  >
                    <Settings size={16} />
                    <span>Manage Settings</span>
                  </button>

                  <button
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <ScrollHint />

          <div className="now-serving-section">
            <div className="now-serving-card">
              <div className="serving-info">
                <div className="serving-header">
                  <span className="now-serving-label">Now Serving</span>
                  <div className="serving-indicator"></div>
                </div>
                <div className="current-number">
                  {currentServing
                    ? (() => {
                        const servingCustomer = queuesByDepartment.find(
                          (item) => item.queueId === currentServing,
                        );
                        return servingCustomer
                          ? `${departmentInfo.prefix}-${servingCustomer.number}`
                          : "None";
                      })()
                    : "None"}
                </div>
                <div className="serving-details">
                  {currentServing &&
                    (() => {
                      const servingCustomer = queuesByDepartment.find(
                        (item) => item.queueId === currentServing,
                      );
                      return servingCustomer ? (
                        <>
                          {servingCustomer.priority === "Priority" && (
                            <Star className="priority-star" size={14} />
                          )}
                          {servingCustomer.service?.serviceName ||
                            "Standard Service"}
                        </>
                      ) : null;
                    })()}
                </div>
              </div>
            </div>
          </div>

          <div className="statistics-section">
            <div className="stats-grid">
              <div className="stat-card waiting">
                <div className="stat-icon">
                  <Clock size={22} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{statistics.waiting}</div>
                  <div className="stat-label">Waiting</div>
                </div>
              </div>
              <div className="stat-card serving">
                <div className="stat-icon">
                  <Users size={22} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{statistics.serving}</div>
                  <div className="stat-label">Serving</div>
                </div>
              </div>

              <div className="stat-card served">
                <div className="stat-icon">
                  <CheckCircle size={22} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{statistics.served}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>
              <div className="stat-card void">
                <div className="stat-icon">
                  <Ban size={22} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{statistics.void}</div>
                  <div className="stat-label">Void</div>
                </div>
              </div>
            </div>
          </div>

          <div className="queue-section">
            <h2 className="section-title">
              <Users size={20} />
              Queue List
            </h2>
            <div className="queue-container">
              <div className="queue-split-container">
                {/* Regular Queue List */}
                <div className="queue-column">
                  <div className="column-header-group">
                    <h3 className="column-title">Regular</h3>
                    <div className="column-actions">
                      <button
                        className="column-action-btn call-btn"
                        onClick={() => handleCallNext("regular")}
                        disabled={isCallLoading || isSpeaking}
                      >
                        {callingPriority === "regular" ? (
                          <Loader2 size={14} className="loading-spinner-btn" />
                        ) : (
                          <Bell size={14} />
                        )}
                        {callingPriority === "regular"
                          ? "Calling..."
                          : "Call Next"}
                      </button>
                      <button
                        className="column-action-btn repeat-btn"
                        onClick={handleRepeatCall}
                        disabled={
                          !currentServing ||
                          isSpeaking ||
                          queuesByDepartment
                            .find((q) => q.queueId === currentServing)
                            ?.priority?.toLowerCase() !== "regular"
                        }
                      >
                        <RotateCcw size={14} />
                        Repeat
                      </button>
                      <button
                        className="column-action-btn void-btn"
                        onClick={handleVoid}
                        disabled={
                          !currentServing ||
                          (() => {
                            const current = queuesByDepartment.find(
                              (q) => q.queueId === currentServing,
                            );
                            return (current?.repeatCount || 0) < 3;
                          })() ||
                          queuesByDepartment
                            .find((q) => q.queueId === currentServing)
                            ?.priority?.toLowerCase() !== "regular"
                        }
                        title={(() => {
                          const current = queuesByDepartment.find(
                            (q) => q.queueId === currentServing,
                          );
                          const count = current?.repeatCount || 0;
                          return count < 3
                            ? `Calls: ${count}/3`
                            : "Void Ticket";
                        })()}
                      >
                        <Ban size={14} />
                        Void
                      </button>
                    </div>
                  </div>
                  <div className="queue-list-wrapper">
                    <div className="queue-header">
                      <div className="queue-col">Ticket</div>
                      <div className="queue-col">Service</div>
                      <div className="queue-col">Status</div>
                    </div>
                    <div className="queue-list">
                      {queueList
                        .filter(
                          (item) => item.priority?.toLowerCase() === "regular",
                        )
                        .map((item, index) => (
                          <div
                            key={item.id ?? index}
                            className={`queue-item ${item.status?.toLowerCase()}`}
                          >
                            <div className="queue-col">
                              <span className="queue-number">
                                {item.displayNumber || item.number || item.id}
                              </span>
                            </div>
                            <div className="queue-col">
                              <span className="service-name">{item.type}</span>
                            </div>
                            <div className="queue-col">
                              <span
                                className={`status ${item.status?.toLowerCase() || ""}`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      {queueList.filter(
                        (item) => item.priority?.toLowerCase() === "regular",
                      ).length === 0 && (
                        <div className="empty-queue">
                          <Users size={32} className="empty-icon" />
                          <p>No regular queues</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Priority Queue List */}
                <div className="queue-column">
                  <div className="column-header-group">
                    <h3 className="column-title priority-title">
                      Priority{" "}
                      <span className="priority-sub">
                        (Senior/PWD/Pregnant)
                      </span>
                    </h3>
                    <div className="column-actions">
                      <button
                        className="column-action-btn call-btn"
                        onClick={() => handleCallNext("priority")}
                        disabled={isCallLoading || isSpeaking}
                      >
                        {callingPriority === "priority" ? (
                          <Loader2 size={14} className="loading-spinner-btn" />
                        ) : (
                          <Bell size={14} />
                        )}
                        {callingPriority === "priority"
                          ? "Calling..."
                          : "Call Next"}
                      </button>
                      <button
                        className="column-action-btn repeat-btn"
                        onClick={handleRepeatCall}
                        disabled={
                          !currentServing ||
                          isSpeaking ||
                          queuesByDepartment
                            .find((q) => q.queueId === currentServing)
                            ?.priority?.toLowerCase() === "regular"
                        }
                      >
                        <RotateCcw size={14} />
                        Repeat
                      </button>
                      <button
                        className="column-action-btn void-btn"
                        onClick={handleVoid}
                        disabled={
                          !currentServing ||
                          (() => {
                            const current = queuesByDepartment.find(
                              (q) => q.queueId === currentServing,
                            );
                            return (current?.repeatCount || 0) < 3;
                          })() ||
                          queuesByDepartment
                            .find((q) => q.queueId === currentServing)
                            ?.priority?.toLowerCase() === "regular"
                        }
                        title={(() => {
                          const current = queuesByDepartment.find(
                            (q) => q.queueId === currentServing,
                          );
                          const count = current?.repeatCount || 0;
                          return count < 3
                            ? `Calls: ${count}/3`
                            : "Void Ticket";
                        })()}
                      >
                        <Ban size={14} />
                        Void
                      </button>
                    </div>
                  </div>
                  <div className="queue-list-wrapper">
                    <div className="queue-header">
                      <div className="queue-col">Ticket</div>
                      <div className="queue-col">Service</div>
                      <div className="queue-col">Status</div>
                    </div>
                    <div className="queue-list">
                      {queueList
                        .filter(
                          (item) => item.priority?.toLowerCase() !== "regular",
                        )
                        .map((item, index) => (
                          <div
                            key={item.id ?? index}
                            className={`queue-item priority-item ${item.status?.toLowerCase()}`}
                          >
                            <div className="queue-col">
                              <span className="queue-number">
                                {item.displayNumber || item.number || item.id}
                              </span>
                            </div>
                            <div className="queue-col">
                              <span className="service-name">{item.type}</span>
                            </div>
                            <div className="queue-col">
                              <span
                                className={`status ${item.status?.toLowerCase() || ""}`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      {queueList.filter(
                        (item) => item.priority?.toLowerCase() !== "regular",
                      ).length === 0 && (
                        <div className="empty-queue">
                          <Star
                            size={32}
                            className="empty-icon priority-icon"
                          />
                          <p>No priority queues</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showQueueForm && (
        <div
          className="queue-form-modal-overlay"
          onClick={() => setShowQueueForm(false)}
        >
          <div
            className="queue-form-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowQueueForm(false)}
            >
              <X size={20} />
            </button>
            <QueueForm onSuccess={handleQueueFormSuccess} />
          </div>
        </div>
      )}

      {showSettings && <Settingspage onClose={() => setShowSettings(false)} />}

      <Footer />
    </div>
  );
};

export default StaffDashboard;
