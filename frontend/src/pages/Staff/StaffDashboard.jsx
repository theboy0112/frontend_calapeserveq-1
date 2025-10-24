import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  LogOut,
  RotateCcw,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Star,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";
import "./styles/StaffDashboard.css";
import { useQuery, useMutation } from "@apollo/client";
import { GET_QUEUES_BY_DEPARTMENT } from "../../graphql/query";
import { UPDATE_QUEUE_STATUS } from "../../graphql/mutation";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [currentServing, setCurrentServing] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statistics, setStatistics] = useState({
    waiting: 0,
    serving: 0,
    served: 0,
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
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const speechSynthRef = useRef(null);
  const notificationSoundRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Audio setup
  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const createNotificationSound = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

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
    const englishVoice = voices.find(
      (voice) =>
        voice.lang.startsWith("en") &&
        (voice.name.includes("Google") || voice.name.includes("Microsoft"))
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
    data: queueQueryData,
    loading: queueLoading,
    error: queueError,
    refetch: refetchQueues,
  } = useQuery(GET_QUEUES_BY_DEPARTMENT, {
    variables: { departmentId: departmentInfo.id },
    skip: !departmentInfo.id || isLoading,
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
        variables: { departmentId: departmentInfo.id }
      }
    ],
    awaitRefetchQueries: true,
  });

  // Calculate statistics
  useEffect(() => {
    if (Array.isArray(queuesByDepartment) && queuesByDepartment.length > 0) {
      const waitingCount = queuesByDepartment.filter(
        (queue) => queue.status?.toLowerCase() === "waiting"
      ).length;

      const servingCount = queuesByDepartment.filter(
        (queue) => queue.status?.toLowerCase() === "serving"
      ).length;

      const servedCount = queuesByDepartment.filter(
        (queue) => queue.status?.toLowerCase() === "complete" || queue.status?.toLowerCase() === "completed"
      ).length;

      setStatistics({
        waiting: waitingCount,
        serving: servingCount,
        served: servedCount,
      });
    } else {
      setStatistics({
        waiting: 0,
        serving: 0,
        served: 0,
      });
    }
  }, [queuesByDepartment]);

  // Load staff info from session
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const userRole = sessionStorage.getItem("userRole");
    const staffData = sessionStorage.getItem("staffInfo");

    if (!token || !role || !userRole) {
      showNotification("Session expired. Please login again.", "warning");
      handleRedirectToLogin();
      return;
    }

    if (!staffData) {
      showNotification("No session found. Please login.", "warning");
      handleRedirectToLogin();
      return;
    }

    try {
      const parsed = JSON.parse(staffData);
      const department = parsed.department;

      if (!department || !department.id || !department.name || !department.prefix) {
        showNotification("Invalid department information. Please login again.", "error");
        handleRedirectToLogin();
        return;
      }

      const deptId = parseInt(department.id);
      if (isNaN(deptId)) {
        showNotification("Invalid department ID. Please login again.", "error");
        handleRedirectToLogin();
        return;
      }

      setStaffInfo(parsed);
      setDepartmentInfo({
        name: department.name.trim(),
        prefix: department.prefix.trim(),
        id: deptId,
      });
      setIsLoading(false);
    } catch (error) {
      showNotification("Invalid session data. Please login again.", "error");
      handleRedirectToLogin();
    }
  }, []);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Transform queue data
  useEffect(() => {
    if (queuesByDepartment?.length) {
      const transformed = queuesByDepartment.map((q) => ({
        id: q.queueId,
        queueId: q.queueId,
        number: q.number,
        type: q.service?.serviceName || "Standard Service",
        priority: q.priority,
        status: q.status,
        createdAt: q.createdAt,
        displayNumber: `${departmentInfo.prefix}-${q.number || ""}`,
        department: q.department,
        service: q.service,
      }));

      const activeQueues = transformed.filter((q) => 
        q.status?.toLowerCase() !== "complete" && 
        q.status?.toLowerCase() !== "completed"
      );
      
      setQueueList(activeQueues);

      const currentServingQueue = transformed.find((q) => 
        q.status?.toLowerCase() === "serving"
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
  }, [queuesByDepartment, departmentInfo.prefix]);

  useEffect(() => {
    if (queueError) {
      console.error("Queue query error:", queueError);
      if (
        queueError.graphQLErrors?.some(
          (error) =>
            error.message.includes("Unauthorized") ||
            error.message.includes("Invalid token") ||
            error.extensions?.code === "UNAUTHENTICATED"
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

  const handleCallNext = async () => {
    if (!Array.isArray(queuesByDepartment)) {
      showNotification("Error: Queue data is not in correct format", "error");
      return;
    }
    
    const waitingCustomers = queuesByDepartment.filter(
      (item) => item.status?.toLowerCase() === "waiting"
    );

    if (!waitingCustomers.length) {
      showNotification("No citizens in queue", "warning");
      return;
    }

    setIsCallLoading(true);

    try {
      const currentServingCustomer = queuesByDepartment.find(
        (item) => item.status?.toLowerCase() === "serving"
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

      const sortedQueue = [...waitingCustomers].sort((a, b) => {
        if (a.priority === "Priority" && b.priority !== "Priority") return -1;
        if (a.priority !== "Priority" && b.priority === "Priority") return 1;
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      });

      const nextCustomer = sortedQueue[0];
      const queueId = nextCustomer.queueId || nextCustomer.id || nextCustomer.queue_id;

      if (!queueId) {
        throw new Error("Next customer has no queueId field");
      }

      await updateQueueStatus({
        variables: {
          updateQueueInput: {
            queueId: parseInt(queueId),
            status: "Serving",
          },
        },
      });

      setCurrentServing(queueId);
      const queueNumber = `${departmentInfo.prefix}-${nextCustomer.number}`;

      showNotification(`Now serving ${queueNumber}`);
      announceCurrentServing(queueNumber, false);
    } catch (error) {
      console.error("Call next error:", error);
      showNotification("Failed to call next citizen", "error");
    } finally {
      setIsCallLoading(false);
    }
  };

  const handleRepeatCall = () => {
    const servingCustomer = queuesByDepartment.find(
      (item) => item.status?.toLowerCase() === "serving"
    );
    
    if (servingCustomer) {
      const queueNumber = `${departmentInfo.prefix}-${servingCustomer.number}`;
      showNotification(`Repeating call for ${queueNumber}`, "info");
      announceCurrentServing(queueNumber, true);
    } else {
      showNotification("No citizen currently being served", "warning");
    }
  };

  const handleLogout = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleSettings = () => {
    setShowUserMenu(false);
    // Navigate to settings or open settings modal
    showNotification("Settings feature coming soon", "info");
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
              <h1 className="dashboard-title">{departmentInfo.name}</h1>
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
                  <span className="user-name">{staffInfo?.name || "Staff User"}</span>
                  <span className="user-role">{staffInfo?.username || "staff"}</span>
                </div>
                <ChevronDown size={16} className={`chevron ${showUserMenu ? 'rotate' : ''}`} />
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown">
                  <button className="dropdown-item" onClick={handleSettings}>
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

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
                          (item) => item.queueId === currentServing
                        );
                        return servingCustomer
                          ? `${departmentInfo.prefix}-${servingCustomer.number}`
                          : "None";
                      })()
                    : "None"}
                </div>
                <div className="serving-details">
                  {currentServing && (() => {
                    const servingCustomer = queuesByDepartment.find(
                      (item) => item.queueId === currentServing
                    );
                    return servingCustomer ? (
                      <>
                        {servingCustomer.priority === "Priority" && (
                          <Star className="priority-star" size={14} />
                        )}
                        {servingCustomer.service?.serviceName || "Standard Service"}
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="action-buttons">
                <button
                  className={`call-next-btn ${isCallLoading ? "loading" : ""}`}
                  onClick={handleCallNext}
                  disabled={isCallLoading || isSpeaking}
                >
                  <Bell size={16} />
                  {isCallLoading ? "Calling..." : "Call Next"}
                </button>
                <button
                  className="repeat-call-btn"
                  onClick={handleRepeatCall}
                  disabled={!currentServing || isSpeaking}
                >
                  <RotateCcw size={16} />
                  Repeat Call
                </button>
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
            </div>
          </div>

          <div className="queue-section">
            <h2 className="section-title">
              <Users size={20} />
              Queue List
            </h2>
            <div className="queue-container">
              <div className="queue-header">
                <div className="queue-col">Ticket</div>
                <div className="queue-col">Service</div>
                <div className="queue-col">Priority</div>
                <div className="queue-col">Status</div>
              </div>
              <div className="queue-list">
                {queueList.map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className={`queue-item ${item.status?.toLowerCase()} ${
                      item.priority?.toLowerCase() === "priority"
                        ? "priority-item"
                        : ""
                    }`}
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
                      <span className={`badge priority ${item.priority?.toLowerCase() || ""}`}>
                        {item.priority}
                      </span>
                    </div>
                    <div className="queue-col">
                      <span className={`status ${item.status?.toLowerCase() || ""}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
                {queueList.length === 0 && (
                  <div className="empty-queue">
                    <Users size={40} className="empty-icon" />
                    <p>No citizens in queue</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StaffDashboard;