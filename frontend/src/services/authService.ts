import type { LoginRequest, LoginResponse } from "../types/auth";

const API_BASE_URL = "http://localhost:8081/api/auth";

// ==================== ADMIN LOGIN ====================
export const loginAdmin = async (
  loginData: LoginRequest
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Admin login error:", error);
    return {
      success: false,
      message: "Cannot connect to server. Please make sure the backend is running.",
      role: null,
      name: null,
    };
  }
};

// ==================== BOOKING MANAGER LOGIN ====================
export const loginBookingManager = async (
  loginData: LoginRequest
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/booking-manager/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Booking Manager login error:", error);
    return {
      success: false,
      message: "Cannot connect to server. Please make sure the backend is running.",
      role: null,
      name: null,
    };
  }
};

// ==================== RESOURCE MANAGER LOGIN ====================
export const loginResourceManager = async (
  loginData: LoginRequest
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/resource-manager/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Resource Manager login error:", error);
    return {
      success: false,
      message: "Cannot connect to server. Please make sure the backend is running.",
      role: null,
      name: null,
    };
  }
};

// ==================== ISSUE MANAGER LOGIN ====================
export const loginIssueManager = async (
  loginData: LoginRequest
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/issue-manager/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Issue Manager login error:", error);
    return {
      success: false,
      message: "Cannot connect to server. Please make sure the backend is running.",
      role: null,
      name: null,
    };
  }
};

// ==================== GENERAL LOGIN (Auto-detects role) ====================
export const login = async (
  loginData: LoginRequest
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Cannot connect to server.",
      role: null,
      name: null,
    };
  }
};