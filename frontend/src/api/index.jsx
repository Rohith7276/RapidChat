 
import { axiosInstance } from "../lib/axios";
 

export const UserSignUp = async (data) => axiosInstance.post("/auth/user/signup", data);
export const UserSignIn = async (data) => axiosInstance.post("/auth/user/signin", data);

export const getDashboardDetails = async (token) =>
  axiosInstance.get("/auth/user/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getWorkouts = async (token, date) =>{
  console.log("hi")
  return await axiosInstance.get(`/auth/user/workout${date}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
export const addWorkout = async (token, data) =>
  await axiosInstance.post(`/auth/user/workout`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });