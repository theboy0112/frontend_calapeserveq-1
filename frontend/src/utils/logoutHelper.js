
export const logoutPreservingRoleData = () => {
  const roleSpecificData = {
    adminStaffId: localStorage.getItem("adminStaffId"),
    adminStaffUsername: localStorage.getItem("adminStaffUsername"),
    adminStaffInfo: localStorage.getItem("adminStaffInfo"),
    queueStaffId: localStorage.getItem("queueStaffId"),
    queueStaffUsername: localStorage.getItem("queueStaffUsername"),
    queueStaffInfo: localStorage.getItem("queueStaffInfo"),
    staffId: localStorage.getItem("staffId"),
    staffUsername: localStorage.getItem("staffUsername"),
    staffInfo: localStorage.getItem("staffInfo")
  };

  sessionStorage.clear();
  
  localStorage.clear();
  
  if (roleSpecificData.adminStaffId) {
    localStorage.setItem("adminStaffId", roleSpecificData.adminStaffId);
    if (roleSpecificData.adminStaffUsername) {
      localStorage.setItem("adminStaffUsername", roleSpecificData.adminStaffUsername);
    }
    if (roleSpecificData.adminStaffInfo) {
      localStorage.setItem("adminStaffInfo", roleSpecificData.adminStaffInfo);
    }
  }
  
  if (roleSpecificData.queueStaffId) {
    localStorage.setItem("queueStaffId", roleSpecificData.queueStaffId);
    if (roleSpecificData.queueStaffUsername) {
      localStorage.setItem("queueStaffUsername", roleSpecificData.queueStaffUsername);
    }
    if (roleSpecificData.queueStaffInfo) {
      localStorage.setItem("queueStaffInfo", roleSpecificData.queueStaffInfo);
    }
  }
  
  if (roleSpecificData.staffId) {
    localStorage.setItem("staffId", roleSpecificData.staffId);
    if (roleSpecificData.staffUsername) {
      localStorage.setItem("staffUsername", roleSpecificData.staffUsername);
    }
    if (roleSpecificData.staffInfo) {
      localStorage.setItem("staffInfo", roleSpecificData.staffInfo);
    }
  }
  
  console.log("Logout completed - role-specific data preserved:", {
    hasAdmin: !!roleSpecificData.adminStaffId,
    hasQueueStaff: !!roleSpecificData.queueStaffId,
    hasStaff: !!roleSpecificData.staffId
  });
};

