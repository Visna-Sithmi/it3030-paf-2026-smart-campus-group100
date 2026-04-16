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

export const resourceService = {
  // Get all resources
  getAllResources: async (): Promise<Resource[]> => {
    const response = await api.get<ApiResponse<Resource[]>>('/resources/all');
    return response.data.data || [];
  },

  // Get resource by ID
  getResourceById: async (id: number): Promise<Resource> => {
    const response = await api.get<ApiResponse<Resource>>(`/resources/${id}`);
    return response.data.data!;
  },

  // Get available resources
  getAvailableResources: async (): Promise<Resource[]> => {
    const response = await api.get<ApiResponse<Resource[]>>('/resources/available');
    return response.data.data || [];
  },

  // Search resources
  searchResources: async (name: string): Promise<Resource[]> => {
    const response = await api.get<ApiResponse<Resource[]>>(`/resources/search?name=${name}`);
    return response.data.data || [];
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
    return response.data.data || [];
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
    return response.data.data!;
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
    return response.data.data!;
  },

  // Update resource status
  updateResourceStatus: async (id: number, status: string): Promise<Resource> => {
    const response = await api.put<ApiResponse<Resource>>(
      `/resources/status/${id}?status=${status}`
    );
    return response.data.data!;
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