import type { LoginRequest, LoginResponse } from "../types/auth";

const API_BASE_URL = "http://localhost:8081/api/auth";

export const loginAdmin = async (
  loginData: LoginRequest
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  });

  const data: LoginResponse = await response.json();
  return data;
};