import axios from "axios";

export const axiosInstance = axios.create({
  // baseURL: import.meta.env.MODE === "development" ? "http://localhost:3000/api" : import.meta.env.VITE_API_BASE_URL + "/api",
  baseURL:  import.meta.env.VITE_API_BASE_URL + "/api",
  withCredentials: true,
});