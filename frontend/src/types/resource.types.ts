// src/types/resource.types.ts

export interface Resource {
  id: number;
  resourceCode: string;
  name: string;
  type: string;
  capacity: number;
  location: string;
  description: string;
  availabilityWindows: string;
  status: 'ACTIVE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  available: boolean;
  imageUrl: string;
  dailyRate: number;
  createdBy: string;

  // IMPORTANT
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourceDTO extends Partial<Resource> {
  imageFile?: File;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ResourceStatistics {
  totalResources: number;
  activeResources: number;
  outOfServiceResources: number;
  maintenanceResources: number;
  availableResources: number;
  typeCounts: Record<string, number>;
}