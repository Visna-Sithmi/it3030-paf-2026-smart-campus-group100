import axios from "axios";
import type {
  ManagerProfile,
  ManagerProfileApiResponse,
  ManagerProfileUpdateRequest,
} from "../types/managerProfile";

const API_BASE_URL = "http://localhost:8081/api/auth/issue-manager";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface RawManagerProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  profileImageUrl?: string | null;
  profile_image_url?: string | null;
}

const normalizeProfile = (raw: RawManagerProfile): ManagerProfile => ({
  id: raw.id,
  name: raw.name,
  email: raw.email,
  role: raw.role,
  profileImageUrl: raw.profileImageUrl ?? raw.profile_image_url ?? null,
});

export const issueManagerProfileService = {
  async getProfile(managerId: number): Promise<ManagerProfile> {
    const response = await api.get<ManagerProfileApiResponse<RawManagerProfile>>(`/profile/${managerId}`);
    return normalizeProfile(response.data.data);
  },

  async updateProfile(managerId: number, payload: ManagerProfileUpdateRequest): Promise<ManagerProfile> {
    const response = await api.put<ManagerProfileApiResponse<RawManagerProfile>>(`/profile/${managerId}`, {
      name: payload.name,
      profileImageUrl: payload.profileImageUrl ?? null,
    });
    return normalizeProfile(response.data.data);
  },
};
