import axios from "axios";

export const getApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "");

  if (configuredBaseUrl) {
    return `${configuredBaseUrl}/api`;
  }

  return `${window.location.origin}/api`;
};

export const axiosInstance = axios.create({
  // baseURL: import.meta.env.MODE === "development" ? "http://localhost:3000/api" : import.meta.env.VITE_API_BASE_URL + "/api",
  baseURL: getApiBaseUrl(),
  timeout: 40000,
  withCredentials: true,
});