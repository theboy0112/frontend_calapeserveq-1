import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($staffUsername: String!, $staffPassword: String!) {
    login(staffUsername: $staffUsername, staffPassword: $staffPassword) {
      success
      access_token
      role
      staff {
        staffId
        staffUsername
        department {
          departmentId
          departmentName
          prefix
        }
        role {
          roleId
          roleName
        }
      }
    }
  }
`;

export const CREATE_DEPARTMENT = gql`
  mutation CreateDepartment($createDepartmentInput: CreateDepartmentInput!) {
    createDepartment(createDepartmentInput: $createDepartmentInput) {
      departmentId
      departmentName
      prefix
      createdAt
    }
  }
`;

export const UPDATE_DEPARTMENT = gql`
  mutation UpdateDepartment($updateDepartmentInput: UpdateDepartmentInput!) {
    updateDepartment(updateDepartmentInput: $updateDepartmentInput) {
      departmentId
      departmentName
      prefix
    }
  }
`;

export const DELETE_DEPARTMENT = gql`
  mutation RemoveDepartment($removeDepartmentId: Int!) {
    removeDepartment(id: $removeDepartmentId) {
      departmentId
    }
  }
`;
export const CREATE_STAFF = gql`
  mutation CreateStaff($createStaffInput: CreateStaffInput!) {
    createStaff(createStaffInput: $createStaffInput) {
      role {
        roleId
        roleName
      }
      departmentId
      department {
        departmentName
        departmentId
      }
      staffId
      staffUsername
      staffPassword
      staffFirstname
      staffLastname
    }
  }
`;
export const UPDATE_STAFF = gql`
  mutation UpdateStaff($updateStaffInput: UpdateStaffInput!) {
    updateStaff(updateStaffInput: $updateStaffInput) {
      staffId
      staffFirstname
      staffLastname
    }
  }
`;
export const DELETE_STAFF = gql`
  mutation RemoveStaff($staffId: Int!) {
    removeStaff(staffId: $staffId) {
      departmentId
    }
  }
`;
export const CREATE_SERVICE = gql`
  mutation Mutation($createServiceInput: CreateServiceInput!) {
    createService(createServiceInput: $createServiceInput) {
      serviceName
    }
  }
`;
export const UPDATE_SERVICE = gql`
  mutation UpdateService($updateServiceInput: UpdateServiceInput!) {
    updateService(updateServiceInput: $updateServiceInput) {
      serviceName
    }
  }
`;
export const DELETE_SERVICE = gql`
  mutation RemoveService($serviceId: Int!) {
    removeService(serviceId: $serviceId) {
      serviceId
    }
  }
`;
export const CREATE_QUEUE = gql`
  mutation CreateQueue($createQueueInput: CreateQueueInput!) {
    createQueue(createQueueInput: $createQueueInput) {
      Department {
        departmentName
      }
      status
      type
      priority
      number
    }
  }
`;
export const CREATE_ROLE = gql`
  mutation CreateRole($createRoleInput: CreateRoleInput!) {
    createRole(createRoleInput: $createRoleInput) {
      roleName
    }
  }
`;
export const UPDATE_QUEUE = gql`
  mutation UpdateQueue($updateQueueInput: UpdateQueueInput!) {
    updateQueue(updateQueueInput: $updateQueueInput) {
      status
    }
  }
`;
