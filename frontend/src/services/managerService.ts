import type { ApiResponse, Manager } from "../types/manager";

const BASE_URL = "http://localhost:8081/api/admin/managers";

export const managerService = {
  async getAllManagers(): Promise<Manager[]> {
    const response = await fetch(`${BASE_URL}/all`);
    const result: ApiResponse<Manager[]> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch managers");
    }

    return result.data || [];
  },

  async getManagersByRole(role: string): Promise<Manager[]> {
    const response = await fetch(`${BASE_URL}/role/${encodeURIComponent(role)}`);
    const result: ApiResponse<Manager[]> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch managers by role");
    }

    return result.data || [];
  },

  async getManagerById(id: number): Promise<Manager> {
    const response = await fetch(`${BASE_URL}/${id}`);
    const result: ApiResponse<Manager> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch manager");
    }

    return result.data;
  },

  async getManagersByRole(role: string): Promise<Manager[]> {
    const response = await fetch(`${BASE_URL}/role/${encodeURIComponent(role)}`);
    const result: ApiResponse<Manager[]> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch managers by role");
    }

    return result.data || [];
  },

  async addManager(manager: Manager): Promise<Manager> {
    const response = await fetch(`${BASE_URL}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(manager),
    });

    const result: ApiResponse<Manager> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to add manager");
    }

    return result.data;
  },

  async updateManager(
    id: number,
    manager: Partial<Manager>
  ): Promise<Manager> {
    const response = await fetch(`${BASE_URL}/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(manager),
    });

    const result: ApiResponse<Manager> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to update manager");
    }

    return result.data;
  },

  async deleteManager(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/delete/${id}`, {
      method: "DELETE",
    });

    const result: ApiResponse<null> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to delete manager");
    }
  },
};