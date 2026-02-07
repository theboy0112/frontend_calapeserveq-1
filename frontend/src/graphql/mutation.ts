import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($staffUsername: String!, $staffPassword: String!) {
    login(staffUsername: $staffUsername, staffPass: $staffPassword) {
      success
      access_token
      role
      staff {
        staffId
        staffUsername
        staffFirstname
        staffLastname
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
  mutation Mutation($createDepartmentInput: CreateDepartmentInput!) {
    createDepartment(createDepartmentInput: $createDepartmentInput) {
      departmentName
      prefix
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
      staffId
      staffUsername
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
      counter {
        counterId
        counterName
      }
    }
  }
`;

export const UPDATE_ADMIN_PROFILE = gql`
  mutation UpdateStaff($updateStaffInput: UpdateStaffInput!) {
    updateStaff(updateStaffInput: $updateStaffInput) {
      staffId
      staffUsername
      staffPassword
      staffFirstname
      staffLastname
    }
  }
`;

export const UPDATE_QUEUESTAFF_PROFILE = gql`
  mutation UpdateStaff($updateStaffInput: UpdateStaffInput!) {
    updateStaff(updateStaffInput: $updateStaffInput) {
      staffId
      staffUsername
      staffPassword
      staffFirstname
      staffLastname
    }
  }
`;

export const DELETE_STAFF = gql`
  mutation removeStaff($staffId: Int!) {
    removeStaff(staffId: $staffId) {
      staffId
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
      serviceId
      serviceName
      department {
        departmentId
        departmentName
      }
    }
  }
`;
export const UPDATE_PASSWORD = gql`
  mutation UpdatePassword($newPassword: String!, $staffId: Float!) {
    updatePassword(newPassword: $newPassword, staffId: $staffId) {
      staffId
      staffUsername
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
    createQueue(createQueueInput: $createQueueInput)
  }
`;
export const UPDATE_QUEUE_STATUS = gql`
  mutation UpdateQueue($updateQueueInput: UpdateQueueInput!) {
    updateQueue(updateQueueInput: $updateQueueInput) {
      queueId
      status
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

export const CALL_NEXT_REPEAT = gql`
  mutation CallNextRepeat($queueId: Int!, $counterId: Int) {
    callNextRepeat(queueId: $queueId, counterId: $counterId) {
      queueId
      status
      repeatCount
    }
  }
`;

export const CALL_NEXT = gql`
  mutation CallNext(
    $staffId: Int!
    $counterId: Int!
    $departmentId: Int!
  ) {
    callNext(
      staffId: $staffId
      counterId: $counterId
      departmentId: $departmentId
    ) {
      queueId
      number
      status
      priority
    }
  }
`;

export const CREATE_COUNTER = gql`
  mutation CreateCounter($createCounterInput: CreateCounterInput!) {
    createCounter(createCounterInput: $createCounterInput) {
      counterId
      counterName
      department {
        departmentId
        departmentName
        prefix
      }
    }
  }
`;

export const UPDATE_COUNTER = gql`
  mutation UpdateCounter($updateCounterInput: UpdateCounterInput!) {
    updateCounter(updateCounterInput: $updateCounterInput) {
      counterId
      counterName
      department {
        departmentId
        departmentName
        prefix
      }
    }
  }
`;

export const DELETE_COUNTER = gql`
  mutation RemoveCounter($removeCounterId: Int!) {
    removeCounter(id: $removeCounterId) {
      counterId
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const RESET_PASSWORD_WITH_TOKEN = gql`
  mutation ResetPasswordWithToken($token: String!, $newPassword: String!) {
    resetPasswordWithToken(token: $token, newPassword: $newPassword) {
      staffId
      staffUsername
    }
  }
`;
