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
      createdAt
    }
  }
`;
export const GET_ALL_STAFF = gql`
  query Query {
    findAll {
      staffId
      staffFirstname
      staffLastname
      department {
        departmentName
        prefix
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
export const GET_QUEUE = gql`
  query Department($queueId: Int!) {
    queue(id: $queueId) {
      Department {
        departmentName
        prefix
      }
      number
      priority
      queueId
      status
      type
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
