import axios from "axios";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
