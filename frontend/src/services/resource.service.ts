// src/services/resource.service.ts
import axios from 'axios';
import type { Resource, ResourceDTO, ApiResponse, ResourceStatistics } from '../types/resource.types';

const API_BASE_URL = 'http://localhost:8081/api/resource-manager';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

interface ResourceApiModel {
  id: number;
  resourceCode?: string;
  resource_code?: string;
  name?: string;
  type?: string;
  targetAudience?: string;
  target_audience?: string;
  capacity?: number;
  location?: string;
  description?: string;
  availabilityWindows?: string;
  availability_windows?: string;
  status?: 'ACTIVE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  available?: boolean;
  isAvailable?: boolean;
  imageUrl?: string;
  image_url?: string;
  dailyRate?: number;
  daily_rate?: number;
  createdBy?: string;
  created_by?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

const normalizeResource = (resource: ResourceApiModel): Resource => ({
  id: resource.id,
  resourceCode: resource.resourceCode || resource.resource_code || '',
  name: resource.name || '',
  type: resource.type || 'LECTURE_HALL',
  capacity: resource.capacity ?? 0,
  location: resource.location || '',
  description: resource.description || '',
  availabilityWindows: resource.availabilityWindows || resource.availability_windows || '',
  status: resource.status || 'ACTIVE',
  available:
    resource.available !== undefined
      ? resource.available
      : resource.isAvailable !== undefined
      ? resource.isAvailable
      : true,
  imageUrl: resource.imageUrl || resource.image_url || '',
  dailyRate:
    resource.dailyRate !== undefined
      ? resource.dailyRate
      : resource.daily_rate !== undefined
      ? resource.daily_rate
      : 0,
  createdBy: resource.createdBy || resource.created_by || '',
  createdAt: resource.createdAt || resource.created_at,
  updatedAt: resource.updatedAt || resource.updated_at,
});

export const resourceService = {
  // Get all resources
  getAllResources: async (): Promise<Resource[]> => {
    const response = await api.get<ApiResponse<Resource[]>>('/resources/all');
    return (response.data.data || []).map((resource) => normalizeResource(resource as unknown as ResourceApiModel));
  },

  // Get resource by ID
  getResourceById: async (id: number): Promise<Resource> => {
    const response = await api.get<ApiResponse<Resource>>(`/resources/${id}`);
    return normalizeResource(response.data.data as unknown as ResourceApiModel);
  },

  // Get available resources
  getAvailableResources: async (): Promise<Resource[]> => {
    const response = await api.get<ApiResponse<Resource[]>>('/resources/available');
    return (response.data.data || []).map((resource) => normalizeResource(resource as unknown as ResourceApiModel));
  },

  // Get resources visible to a client audience (STUDENT or LECTURER)
  getResourcesForAudience: async (audience: 'STUDENT' | 'LECTURER'): Promise<Resource[]> => {
    const response = await api.get<ApiResponse<Resource[]>>(`/resources/client/${audience}`);
    return (response.data.data || []).map((resource) => normalizeResource(resource as unknown as ResourceApiModel));
  },

  // Get resources visible to a client audience (STUDENT or LECTURER)
  getResourcesForAudience: async (audience: 'STUDENT' | 'LECTURER'): Promise<Resource[]> => {
    const response = await api.get<ApiResponse<Resource[]>>(`/resources/client/${audience}`);
    return response.data.data || [];
  },

  // Search resources
  searchResources: async (name: string): Promise<Resource[]> => {
    const response = await api.get<ApiResponse<Resource[]>>(`/resources/search?name=${name}`);
    return (response.data.data || []).map((resource) => normalizeResource(resource as unknown as ResourceApiModel));
  },

  // Filter resources
  filterResources: async (filters: {
    type?: string;
    minCapacity?: number;
    location?: string;
  }): Promise<Resource[]> => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.minCapacity) params.append('minCapacity', filters.minCapacity.toString());
    if (filters.location) params.append('location', filters.location);
    
    const response = await api.get<ApiResponse<Resource[]>>(`/resources/filter?${params}`);
    return (response.data.data || []).map((resource) => normalizeResource(resource as unknown as ResourceApiModel));
  },

  // FIXED: Add resource with image - Send as JSON STRING, not Blob
  addResource: async (resource: ResourceDTO): Promise<Resource> => {
    const formData = new FormData();
    
    // ✅ CORRECT: Send as JSON string directly
    const resourceJson = JSON.stringify(resource);
    formData.append('resource', resourceJson);
    
    if (resource.imageFile) {
      formData.append('image', resource.imageFile);
    }
    
    const response = await api.post<ApiResponse<Resource>>('/resources/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return normalizeResource(response.data.data as unknown as ResourceApiModel);
  },

  // FIXED: Update resource - Send as JSON STRING, not Blob
  updateResource: async (id: number, resource: ResourceDTO): Promise<Resource> => {
    const formData = new FormData();
    
    // ✅ CORRECT: Send as JSON string directly
    const resourceJson = JSON.stringify(resource);
    formData.append('resource', resourceJson);
    
    if (resource.imageFile) {
      formData.append('image', resource.imageFile);
    }
    
    const response = await api.put<ApiResponse<Resource>>(`/resources/update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return normalizeResource(response.data.data as unknown as ResourceApiModel);
  },

  // Update resource status
  updateResourceStatus: async (id: number, status: string): Promise<Resource> => {
    const response = await api.put<ApiResponse<Resource>>(
      `/resources/status/${id}?status=${status}`
    );
    return normalizeResource(response.data.data as unknown as ResourceApiModel);
  },

  // Delete resource
  deleteResource: async (id: number): Promise<void> => {
    await api.delete(`/resources/delete/${id}`);
  },

  // Get statistics
  getStatistics: async (): Promise<ResourceStatistics> => {
    const response = await api.get<ApiResponse<ResourceStatistics>>('/resources/statistics');
    return response.data.data!;
  },

  // Upload image only
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ApiResponse<string>>('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },
};