const BASE_URL =
  import.meta.env.VITE_BASE_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:8080");

export const AUTH = {
  LOGIN: `${BASE_URL}/user/login`,
  LOGOUT: `${BASE_URL}/user/logout`,
  PROFILE: `${BASE_URL}/user/profile`,
  GET_ALL_USERS: `${BASE_URL}/user/all`,
  CREATE_USER: `${BASE_URL}/user/create`,
  UPDATE_USER: (id) => `${BASE_URL}/user/update/${id}`,
  DELETE_USER: (id) => `${BASE_URL}/user/delete/${id}`,
  ASSIGN_ROLES: `${BASE_URL}/user/assign-roles`,
};

export const ROLES = {
  GET_ALL: `${BASE_URL}/roles/all`,
  CREATE: `${BASE_URL}/roles/create`,
  UPDATE: (id) => `${BASE_URL}/roles/update/${id}`,
  DELETE: (id) => `${BASE_URL}/roles/delete/${id}`,
};

export const DASHBOARD = {
  ME: `${BASE_URL}/dashboard/me`,
  RESET: `${BASE_URL}/dashboard/reset`,
  STATS: `${BASE_URL}/dashboard/stats`,
  DATASET: (name) => `${BASE_URL}/dashboard/dataset/${name}`,
};

export const AUDIT = {
  GET_ALL: `${BASE_URL}/audit/all`,
};
