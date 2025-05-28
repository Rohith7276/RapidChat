import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:   "https://rapidchat-10.onrender.com/api" ,
  withCredentials: true,
});