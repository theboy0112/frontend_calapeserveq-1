import { gql } from "@apollo/client";

export const GET_DEPARTMENT = gql`
  query GetDepartment($departmentId: Int!) {
    department(id: $departmentId) {
      departmentId
      departmentName
      prefix
      createdAt
    }
  }
`;

export const GET_DEPARTMENTS = gql`
  query GetDepartments {
    departments {
      departmentId
      departmentName
      prefix
    }
  }
`;
export const GET_ALL_STAFF = gql`
  query Query {
  staffs {
    department {
      departmentName
    }
    staffFirstname
    staffLastname
    role {
      roleName
    }
  }
}
`;
export const GET_STAFF = gql`
  query Staff($staffId: Int!) {
    staff(staffId: $staffId) {
      department {
        departmentName
        prefix
      }
    }
  }
`;

export const GET_ADMIN_PROFILE = gql`
  query Staff($staffId: Int!) {
    staff(staffId: $staffId) {
      staffId
      staffFirstname
      staffLastname
      staffUsername
      
      }
    }
`;

export const GET_SERVICES = gql`
  query Services {
    services {
      serviceId
      serviceName
      department {
        departmentId
        departmentName
      }
    }
  }
`;
export const GET_QUEUES_BY_DEPARTMENT = gql`
  query QueueByDepartment($departmentId: Int!) {
    QueueByDepartment(departmentId: $departmentId) {
      queueId
      number
      priority
      status
      createdAt
      department {
        departmentId
        departmentName
        prefix
      }
      service {
        serviceId
        serviceName
      }
    }
  }
`;

export const GET_ALL_QUEUES_DEPARTMENT = gql`
  query GetAllQueuesDepartment {
    Queue {
      queueId
      createdAt
      status
      department {
        departmentId
        departmentName
      }
    }
  }
`;


export const GET_ROLES = gql`
  query GetAllRoles {
    roles {
      roleId
      roleName
    }
  }
`;
