import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  Search,
  BarChart3,
  Plus,
  LogOut,
  X,
  Upload,
  Edit,
  Info,
  Trash2,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Shield,
  Lock,
  Unlock,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import logo from '../../../assets/logo.jpeg';
import './resourceDashboard.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface ResourceApi {
  id: number;
  resourceCode?: string;
  resource_code?: string;
  name: string;
  type: string;
  targetAudience?: 'STUDENT' | 'LECTURER' | 'BOTH' | string;
  target_audience?: 'STUDENT' | 'LECTURER' | 'BOTH' | string;
  capacity: number;
  location: string;
  description: string;
  availabilityWindows?: string;
  availability_windows?: string;
  status: 'ACTIVE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  available?: boolean;
  isAvailable?: boolean;
  imageUrl?: string;
  image_url?: string;
  dailyRate?: number;
  daily_rate?: number;
  createdBy?: string;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

interface Resource {
  id: number;
  resourceCode: string;
  name: string;
  type: string;
  targetAudience: 'STUDENT' | 'LECTURER' | 'BOTH';
  capacity: number;
  location: string;
  description: string;
  availabilityWindows: string;
  status: 'ACTIVE' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
  available: boolean;
  imageUrl?: string;
  dailyRate: number;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AvailabilityConfig {
  mode: 'FIXED_DAILY';
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

interface Holiday {
  id: number;
  holiday_name: string;
  holidayName?: string;
  holiday_date: string;
  holidayDate?: string;
  description: string;
  closed: boolean;
  created_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface SystemStatus {
  globalLock: boolean;
  isHoliday: boolean;
  today: string;
}

interface ValidationErrors {
  resourceCode?: string;
  name?: string;
  capacity?: string;
  location?: string;
  description?: string;
  holidayDate?: string;
  holidayName?: string;
  holidayDesc?: string;
}

const API_BASE_URL = 'http://localhost:8081/api/resource-manager';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const DEFAULT_RESOURCE_TYPES = [
  'LECTURE_HALL',
  'LAB',
  'MEETING_ROOM',
  'DISCUSSION_ROOM',
  'SPORTS_FACILITY',
  'EQUIPMENT',
  'LIBRARY_SPACE',
  'AUDITORIUM',
  'OTHER',
];

const RESOURCE_AUDIENCE_OPTIONS = ['STUDENT', 'LECTURER', 'BOTH'];

const DEFAULT_AVAILABILITY_CONFIG: AvailabilityConfig = {
  mode: 'FIXED_DAILY',
  startTime: '08:30',
  endTime: '20:30',
  slotDurationMinutes: 60,
};

const formatTypeLabel = (type: string) => type.replace(/_/g, ' ');

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return 'Select a date';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatHolidayDate = (dateString: string) => {
  if (!dateString) return 'Invalid Date';
  try {
    let date: Date;
    if (dateString.includes('-')) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
};

const timeStringToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTimeString = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${`${hrs}`.padStart(2, '0')}:${`${mins}`.padStart(2, '0')}`;
};

const formatTime12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${`${minutes}`.padStart(2, '0')} ${period}`;
};

const generateTimeSlots = (config: AvailabilityConfig) => {
  const startMinutes = timeStringToMinutes(config.startTime);
  const endMinutes = timeStringToMinutes(config.endTime);
  const duration = config.slotDurationMinutes;

  const slots: { start: string; end: string; label: string }[] = [];

  for (let current = startMinutes; current < endMinutes; current += duration) {
    const slotStart = minutesToTimeString(current);
    const slotEnd = minutesToTimeString(current + duration);
    slots.push({
      start: slotStart,
      end: slotEnd,
      label: `${formatTime12Hour(slotStart)} - ${formatTime12Hour(slotEnd)}`,
    });
  }

  return slots;
};

const parseAvailabilityConfig = (availabilityWindows?: string): AvailabilityConfig => {
  if (!availabilityWindows || availabilityWindows.trim() === '') {
    return DEFAULT_AVAILABILITY_CONFIG;
  }

  try {
    const parsed = JSON.parse(availabilityWindows);
    if (
      parsed &&
      parsed.mode === 'FIXED_DAILY' &&
      parsed.startTime &&
      parsed.endTime &&
      parsed.slotDurationMinutes
    ) {
      return {
        mode: 'FIXED_DAILY',
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        slotDurationMinutes: parsed.slotDurationMinutes,
      };
    }
    return DEFAULT_AVAILABILITY_CONFIG;
  } catch {
    return DEFAULT_AVAILABILITY_CONFIG;
  }
};

const buildAvailabilityString = (config: AvailabilityConfig) => {
  return JSON.stringify(config);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    if (axiosError.code === 'ERR_NETWORK') {
      return 'Cannot reach backend. Check Spring Boot server and CORS configuration.';
    }

    if (axiosError.message) {
      return axiosError.message;
    }
  }

  return fallback;
};

const ResourceDashboard: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [availabilityViewDate, setAvailabilityViewDate] = useState<string>(getTodayDateString());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [holidayValidationErrors, setHolidayValidationErrors] = useState<ValidationErrors>({});

  // Availability Modal State
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityResource, setAvailabilityResource] = useState<Resource | null>(null);

  const [globalLock, setGlobalLock] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaySubmitting, setHolidaySubmitting] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    globalLock: false,
    isHoliday: false,
    today: getTodayDateString(),
  });

  // Calendar State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [showNoHolidayPopup, setShowNoHolidayPopup] = useState(false);
  const [noHolidayDate, setNoHolidayDate] = useState<Date | null>(null);

  const [newHoliday, setNewHoliday] = useState({
    holidayName: '',
    holidayDate: '',
    description: '',
  });

  const [formData, setFormData] = useState({
    id: null as number | null,
    resourceCode: '',
    name: '',
    type: 'LECTURE_HALL',
    targetAudience: 'BOTH' as 'STUDENT' | 'LECTURER' | 'BOTH',
    capacity: 0,
    location: '',
    description: '',
    availabilityWindows: buildAvailabilityString(DEFAULT_AVAILABILITY_CONFIG),
    status: 'ACTIVE' as 'ACTIVE' | 'OUT_OF_SERVICE' | 'MAINTENANCE',
    available: true,
    createdBy: 'resource_manager_1',
  });

  const [availabilityConfig, setAvailabilityConfig] =
    useState<AvailabilityConfig>(DEFAULT_AVAILABILITY_CONFIG);
  const [availabilityFormDate, setAvailabilityFormDate] = useState<string>(getTodayDateString());

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  // Real-time input restriction functions
  const restrictResourceCode = (value: string): string => {
    let filtered = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (filtered.length > 6) filtered = filtered.slice(0, 6);
    
    const letters = filtered.match(/[A-Z]/g) || [];
    const numbers = filtered.match(/[0-9]/g) || [];
    
    if (letters.length > 3) return filtered.slice(0, 3) + numbers.join('').slice(0, 3);
    if (numbers.length > 3) return letters.join('') + numbers.slice(0, 3).join('');
    
    return filtered;
  };

  const restrictResourceName = (value: string): string => {
    let filtered = value.replace(/[^A-Za-z\s]/g, '');
    if (filtered.length > 100) filtered = filtered.slice(0, 100);
    return filtered;
  };

  // Holiday restriction functions
  const restrictHolidayName = (value: string): string => {
    let filtered = value.replace(/[^A-Za-z\s-]/g, '');
    if (filtered.length > 100) filtered = filtered.slice(0, 100);
    return filtered;
  };

  const restrictHolidayDescription = (value: string): string => {
    let filtered = value.replace(/[^A-Za-z0-9\s,.'"!?-]/g, '');
    if (filtered.length > 500) filtered = filtered.slice(0, 500);
    return filtered;
  };

  const restrictCapacity = (value: number): number => {
    if (isNaN(value)) return 1;
    if (value < 1) return 1;
    if (value > 30000) return 30000;
    return value;
  };

  // Validation Functions
  const validateResourceCode = (code: string): boolean => {
    const pattern = /^[A-Z]{1,3}\d{3}$/;
    return pattern.test(code);
  };

  const validateResourceName = (name: string): boolean => {
    const pattern = /^[A-Za-z\s]+$/;
    return pattern.test(name) && name.trim().length > 0 && name.trim().length <= 100;
  };

  const validateCapacity = (capacity: number, type: string): boolean => {
    if (type === 'EQUIPMENT') return true;
    return capacity >= 1 && capacity <= 30000;
  };

  const validateLocation = (location: string): boolean => {
    return location.trim().length > 0;
  };

  const validateDescription = (description: string): boolean => {
    if (!description.trim()) return false;
    const wordCount = description.trim().split(/\s+/).length;
    return wordCount >= 5;
  };

  const validateHolidayDate = (date: string): boolean => {
    if (!date) return false;
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  };

  const validateHolidayName = (name: string): boolean => {
    const pattern = /^[A-Za-z\s-]+$/;
    return pattern.test(name) && name.trim().length > 0 && name.trim().length <= 100;
  };

  const validateHolidayDescription = (desc: string): boolean => {
    if (!desc.trim()) return true;
    const pattern = /^[A-Za-z0-9\s,.'"!?-]+$/;
    return pattern.test(desc) && desc.length <= 500;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.resourceCode) {
      errors.resourceCode = 'Resource code is required';
    } else if (!validateResourceCode(formData.resourceCode)) {
      errors.resourceCode = 'Resource code must contain 1-3 CAPITAL letters followed by 3 digits (e.g., LH101, ABC123)';
    }
    
    if (!formData.name) {
      errors.name = 'Resource name is required';
    } else if (!validateResourceName(formData.name)) {
      errors.name = 'Resource name can only contain letters and spaces (no numbers)';
    }
    
    if (formData.type !== 'EQUIPMENT') {
      if (formData.capacity < 1) {
        errors.capacity = 'Capacity cannot be 0 or negative';
      } else if (formData.capacity > 30000) {
        errors.capacity = 'Capacity cannot exceed 30,000';
      }
    }
    
    if (!formData.location) {
      errors.location = 'Location is required';
    }
    
    if (!formData.description) {
      errors.description = 'Description is required';
    } else if (!validateDescription(formData.description)) {
      errors.description = 'Description must contain at least 5 words';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateHolidayForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!newHoliday.holidayName.trim()) {
      errors.holidayName = 'Holiday name is required';
    } else if (!validateHolidayName(newHoliday.holidayName)) {
      errors.holidayName = 'Holiday name can only contain letters, spaces, and hyphens (no numbers or special characters)';
    }
    
    if (!newHoliday.holidayDate) {
      errors.holidayDate = 'Holiday date is required';
    } else if (!validateHolidayDate(newHoliday.holidayDate)) {
      errors.holidayDate = 'Holiday date cannot be in the past';
    }
    
    if (newHoliday.description && !validateHolidayDescription(newHoliday.description)) {
      errors.holidayDesc = 'Description can only contain letters, numbers, spaces, and basic punctuation (no special characters)';
    }
    
    setHolidayValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const normalizeResource = (resource: ResourceApi): Resource => {
    return {
      id: resource.id,
      resourceCode: resource.resourceCode || resource.resource_code || '',
      name: resource.name || '',
      type: resource.type || 'LECTURE_HALL',
      targetAudience: (resource.targetAudience || resource.target_audience || 'BOTH') as 'STUDENT' | 'LECTURER' | 'BOTH',
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
      createdBy: resource.createdBy || resource.created_by || 'resource_manager_1',
      createdAt: resource.createdAt || resource.created_at,
      updatedAt: resource.updatedAt || resource.updated_at,
    };
  };

  const getImageUrl = (resource: Resource): string | null => {
    if (!resource.imageUrl) return null;
    return resource.imageUrl.startsWith('http')
      ? resource.imageUrl
      : `http://localhost:8081${resource.imageUrl}`;
  };

  const getTypeOptions = (currentType?: string) => {
    if (currentType && !DEFAULT_RESOURCE_TYPES.includes(currentType)) {
      return [currentType, ...DEFAULT_RESOURCE_TYPES];
    }
    return DEFAULT_RESOURCE_TYPES;
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<ResourceApi[]>>('/resources/all');
      if (response.data.success) {
        const normalizedResources = (response.data.data || []).map((item) => normalizeResource(item));
        setResources(normalizedResources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      alert(getErrorMessage(error, 'Failed to fetch resources'));
    } finally {
      setLoading(false);
    }
  };

  const checkSystemStatus = async () => {
    try {
      const response = await api.get<ApiResponse<SystemStatus>>('/system/status');
      if (response.data.success) {
        setGlobalLock(response.data.data.globalLock);
        setIsHoliday(response.data.data.isHoliday);
        setSystemStatus({
          globalLock: response.data.data.globalLock,
          isHoliday: response.data.data.isHoliday,
          today: response.data.data.today,
        });
      }
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await api.get<ApiResponse<Holiday[]>>('/holidays/all');
      if (response.data.success) {
        setHolidays(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      alert(getErrorMessage(error, 'Failed to fetch holidays'));
    }
  };

  useEffect(() => {
    fetchResources();
    checkSystemStatus();
    fetchHolidays();
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      availabilityWindows: buildAvailabilityString(availabilityConfig),
    }));
  }, [availabilityConfig]);

  const resetForm = () => {
    const defaultConfig = DEFAULT_AVAILABILITY_CONFIG;
    setFormData({
      id: null,
      resourceCode: '',
      name: '',
      type: 'LECTURE_HALL',
      targetAudience: 'BOTH',
      capacity: 0,
      location: '',
      description: '',
      availabilityWindows: buildAvailabilityString(defaultConfig),
      status: 'ACTIVE',
      available: true,
      createdBy: 'resource_manager_1',
    });
    setAvailabilityConfig(defaultConfig);
    setAvailabilityFormDate(getTodayDateString());
    setSelectedImage(null);
    setImagePreview(null);
    setCurrentImageUrl(null);
    setValidationErrors({});
  };

  const resetHolidayForm = () => {
    setNewHoliday({
      holidayName: '',
      holidayDate: '',
      description: '',
    });
    setHolidayValidationErrors({});
  };

  const enableGlobalLock = async () => {
    if (!window.confirm('⚠️ This will make ALL resources unavailable. Continue?')) return;

    try {
      const response = await api.put<ApiResponse<any>>('/lock/enable');
      if (response.data.success) {
        alert(response.data.message || 'All resources have been disabled');
        await Promise.all([fetchResources(), checkSystemStatus()]);
      } else {
        alert(response.data.message || 'Failed to enable lock');
      }
    } catch (error) {
      console.error('Error enabling global lock:', error);
      alert(getErrorMessage(error, 'Failed to enable lock'));
    }
  };

  const disableGlobalLock = async () => {
    try {
      const response = await api.put<ApiResponse<any>>('/lock/disable');
      if (response.data.success) {
        alert(response.data.message || 'Resources are now available');
        await Promise.all([fetchResources(), checkSystemStatus()]);
      } else {
        alert(response.data.message || 'Failed to disable lock');
      }
    } catch (error) {
      console.error('Error disabling global lock:', error);
      alert(getErrorMessage(error, 'Failed to disable lock'));
    }
  };

const addHoliday = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateHolidayForm()) {
    const firstError = document.querySelector('.holiday-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  setHolidaySubmitting(true);

  try {
    const formattedDate = newHoliday.holidayDate;
    
    console.log('Sending holiday data:', {  // Debug log
      holidayName: newHoliday.holidayName.trim(),
      holidayDate: formattedDate,
      description: newHoliday.description.trim(),
    });

    const holidayData = {
      holidayName: newHoliday.holidayName.trim(),
      holidayDate: formattedDate,
      description: newHoliday.description.trim(),
    };

    const response = await api.post<ApiResponse<any>>('/holidays/add', holidayData);

    if (response.data.success) {
      alert(response.data.message || 'Holiday added successfully');
      resetHolidayForm();
      await Promise.all([fetchHolidays(), fetchResources(), checkSystemStatus()]);
    } else {
      alert(response.data.message || 'Failed to add holiday');
    }
  } catch (error: unknown) {  // Explicitly type as unknown
    console.error('Error adding holiday:', error);
    
    // Type-safe error handling
    if (axios.isAxiosError(error)) {
      // Axios error with response
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add holiday';
      console.error('API Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      alert(errorMessage);
    } else if (error instanceof Error) {
      // Standard JavaScript error
      alert(error.message);
    } else {
      // Unknown error type
      alert('An unexpected error occurred while adding the holiday');
    }
  } finally {
    setHolidaySubmitting(false);
  }
};

  const deleteHoliday = async (id: number) => {
    if (!window.confirm('Delete this holiday?')) return;

    try {
      const response = await api.delete<ApiResponse<any>>(`/holidays/delete/${id}`);
      if (response.data.success) {
        alert(response.data.message || 'Holiday deleted successfully');
        await Promise.all([fetchHolidays(), fetchResources(), checkSystemStatus()]);
      } else {
        alert(response.data.message || 'Failed to delete holiday');
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      alert(getErrorMessage(error, 'Failed to delete holiday'));
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();

      const resourceForBackend = {
        resource_code: formData.resourceCode,
        name: formData.name,
        type: formData.type,
        targetAudience: formData.targetAudience,
        capacity: formData.type === 'EQUIPMENT' ? null : formData.capacity,
        location: formData.location,
        description: formData.description,
        availabilityWindows: buildAvailabilityString(availabilityConfig),
        status: formData.status,
        available: formData.available,
        createdBy: formData.createdBy,
      };

      formDataToSend.append('resource', JSON.stringify(resourceForBackend));

      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      const response = await axios.post(`${API_BASE_URL}/resources/add`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        await fetchResources();
        setShowAddModal(false);
        resetForm();
        alert(response.data.message || 'Resource added successfully');
      } else {
        alert(response.data.message || 'Failed to add resource');
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      alert(getErrorMessage(error, 'Failed to add resource'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();

      const resourceForBackend: any = {
        resource_code: formData.resourceCode,
        name: formData.name,
        type: formData.type,
        targetAudience: formData.targetAudience,
        capacity: formData.type === 'EQUIPMENT' ? null : formData.capacity,
        location: formData.location,
        description: formData.description,
        availabilityWindows: buildAvailabilityString(availabilityConfig),
        status: formData.status,
        available: formData.available,
        createdBy: formData.createdBy,
      };

      if (currentImageUrl) {
        resourceForBackend.image_url = currentImageUrl.replace('http://localhost:8081', '');
      }

      formDataToSend.append('resource', JSON.stringify(resourceForBackend));

      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      const response = await axios.put(
        `${API_BASE_URL}/resources/update/${formData.id}`,
        formDataToSend,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.success) {
        await fetchResources();
        setShowEditModal(false);
        resetForm();
        alert(response.data.message || 'Resource updated successfully');
      } else {
        alert(response.data.message || 'Failed to update resource');
      }
    } catch (error) {
      console.error('Error updating resource:', error);
      alert(getErrorMessage(error, 'Failed to update resource'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await api.put<ApiResponse<any>>(`/resources/status/${id}?status=${status}`);
      if (response.data.success) {
        await fetchResources();
      } else {
        alert(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(getErrorMessage(error, 'Failed to update status'));
    }
  };

  const handleDeleteResource = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await api.delete<ApiResponse<any>>(`/resources/delete/${id}`);
      if (response.data.success) {
        await fetchResources();
      } else {
        alert(response.data.message || 'Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert(getErrorMessage(error, 'Failed to delete resource'));
    }
  };

  const openEditModal = (resource: Resource) => {
    const parsedConfig = parseAvailabilityConfig(resource.availabilityWindows);

    setFormData({
      id: resource.id,
      resourceCode: resource.resourceCode || '',
      name: resource.name || '',
      type: resource.type || 'LECTURE_HALL',
      targetAudience: resource.targetAudience || 'BOTH',
      capacity: resource.capacity || 0,
      location: resource.location || '',
      description: resource.description || '',
      availabilityWindows: resource.availabilityWindows || buildAvailabilityString(parsedConfig),
      status: resource.status || 'ACTIVE',
      available: resource.available,
      createdBy: resource.createdBy || 'resource_manager_1',
    });

    setAvailabilityConfig(parsedConfig);
    setAvailabilityFormDate(getTodayDateString());
    setCurrentImageUrl(getImageUrl(resource));
    setImagePreview(null);
    setSelectedImage(null);
    setValidationErrors({});
    setShowEditModal(true);
  };

  const openDetailsModal = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDetailsModal(true);
  };

  const openAvailabilityModal = (resource: Resource) => {
    setAvailabilityResource(resource);
    setAvailabilityViewDate(getTodayDateString());
    setShowAvailabilityModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG and PNG files are allowed');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Calendar helper functions for react-calendar
  const getHolidayForDate = (date: Date): Holiday | undefined => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return holidays.find(h => {
      const hDate = h.holiday_date || h.holidayDate;
      return hDate === dateStr;
    });
  };

  const handleDateClick = (value: Value) => {
    if (value instanceof Date) {
      const holiday = getHolidayForDate(value);
      if (holiday) {
        setSelectedHoliday(holiday);
      } else {
        setNoHolidayDate(value);
        setShowNoHolidayPopup(true);
      }
    }
  };

  const closeNoHolidayPopup = () => {
    setShowNoHolidayPopup(false);
    setNoHolidayDate(null);
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const holiday = getHolidayForDate(date);
      if (holiday) {
        return 'holiday-tile';
      }
    }
    return null;
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const holiday = getHolidayForDate(date);
      if (holiday) {
        return <div className="holiday-dot"></div>;
      }
    }
    return null;
  };

  const handleHolidayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'holidayName') {
      const restrictedValue = restrictHolidayName(value);
      setNewHoliday((prev) => ({ ...prev, holidayName: restrictedValue }));
      if (holidayValidationErrors.holidayName && validateHolidayName(restrictedValue)) {
        setHolidayValidationErrors((prev) => ({ ...prev, holidayName: undefined }));
      }
    } else if (name === 'description') {
      const restrictedValue = restrictHolidayDescription(value);
      setNewHoliday((prev) => ({ ...prev, description: restrictedValue }));
      if (holidayValidationErrors.holidayDesc && validateHolidayDescription(restrictedValue)) {
        setHolidayValidationErrors((prev) => ({ ...prev, holidayDesc: undefined }));
      }
    } else if (name === 'holidayDate') {
      setNewHoliday((prev) => ({ ...prev, holidayDate: value }));
      if (holidayValidationErrors.holidayDate && validateHolidayDate(value)) {
        setHolidayValidationErrors((prev) => ({ ...prev, holidayDate: undefined }));
      }
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === 'resourceCode') {
      const restrictedValue = restrictResourceCode(value);
      setFormData((prev) => ({ ...prev, resourceCode: restrictedValue }));
      if (validationErrors.resourceCode && validateResourceCode(restrictedValue)) {
        setValidationErrors((prev) => ({ ...prev, resourceCode: undefined }));
      }
    } 
    else if (name === 'name') {
      const restrictedValue = restrictResourceName(value);
      setFormData((prev) => ({ ...prev, name: restrictedValue }));
      if (validationErrors.name && validateResourceName(restrictedValue)) {
        setValidationErrors((prev) => ({ ...prev, name: undefined }));
      }
    }
    else if (name === 'location') {
      setFormData((prev) => ({ ...prev, location: value }));
      if (validationErrors.location && value.trim().length > 0) {
        setValidationErrors((prev) => ({ ...prev, location: undefined }));
      }
    }
    else if (name === 'description') {
      setFormData((prev) => ({ ...prev, description: value }));
      if (validationErrors.description && value.trim().split(/\s+/).length >= 5) {
        setValidationErrors((prev) => ({ ...prev, description: undefined }));
      }
    }
    else if (name === 'capacity') {
      let numValue = type === 'number' ? Number(value) : Number(value);
      if (isNaN(numValue)) numValue = 1;
      const restrictedValue = restrictCapacity(numValue);
      setFormData((prev) => ({ ...prev, capacity: restrictedValue }));
      if (validationErrors.capacity && validateCapacity(restrictedValue, formData.type)) {
        setValidationErrors((prev) => ({ ...prev, capacity: undefined }));
      }
    }
    else if (name === 'type') {
      setFormData((prev) => {
        let updated = { ...prev, type: value };
        if (value === 'EQUIPMENT') {
          updated.capacity = 1;
        }
        return updated;
      });
    }
    else {
      setFormData((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    }
  };

  const filteredResources = resources.filter((resource) => {
    const code = resource.resourceCode || '';
    const name = resource.name || '';
    const type = resource.type || '';

    return (
      searchTerm === '' ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'OUT_OF_SERVICE':
        return 'status-out';
      case 'MAINTENANCE':
        return 'status-maintenance';
      default:
        return 'status-default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'OUT_OF_SERVICE':
        return 'Out of Service';
      case 'MAINTENANCE':
        return 'Maintenance';
      default:
        return status;
    }
  };

  const closeHolidayPopup = () => {
    setSelectedHoliday(null);
  };

  const availabilitySlotsForForm = generateTimeSlots(availabilityConfig);

  const AvailabilityEditor = () => (
    <div className="form-col-span-2">
      <label className="form-label">Availability Schedule</label>

      <div className="availability-editor-box">
        <div className="availability-editor-grid">
          <div>
            <label className="mini-label">Start Time</label>
            <input
              type="time"
              value={availabilityConfig.startTime}
              onChange={(e) =>
                setAvailabilityConfig((prev) => ({
                  ...prev,
                  startTime: e.target.value,
                }))
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="mini-label">End Time</label>
            <input
              type="time"
              value={availabilityConfig.endTime}
              onChange={(e) =>
                setAvailabilityConfig((prev) => ({
                  ...prev,
                  endTime: e.target.value,
                }))
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="mini-label">Slot Duration</label>
            <select
              value={availabilityConfig.slotDurationMinutes}
              onChange={(e) =>
                setAvailabilityConfig((prev) => ({
                  ...prev,
                  slotDurationMinutes: Number(e.target.value),
                }))
              }
              className="input-field"
            >
              <option value={60}>60 minutes</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mini-label">Select Date to Preview Slots</label>
          <input
            type="date"
            value={availabilityFormDate}
            min={getTodayDateString()}
            onChange={(e) => setAvailabilityFormDate(e.target.value)}
            className="input-field input-date-preview"
          />
          <p className="availability-date-text">{formatDateForDisplay(availabilityFormDate)}</p>
        </div>

        <div>
          <div className="availability-header-row">
            <p className="availability-title">Available Time Slots</p>
            <span className="availability-count">{availabilitySlotsForForm.length} slots per day</span>
          </div>

          <div className="slot-grid slot-grid-three">
            {availabilitySlotsForForm.map((slot, index) => (
              <div
                key={`${slot.start}-${slot.end}-${index}`}
                className="slot-badge"
              >
                {slot.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Professional Availability Modal Component
  const AvailabilityViewerModal = ({ resource, onClose }: { resource: Resource; onClose: () => void }) => {
    const config = parseAvailabilityConfig(resource.availabilityWindows);
    const slots = generateTimeSlots(config);
    const [viewDate, setViewDate] = useState<string>(getTodayDateString());
    const [currentPage, setCurrentPage] = useState(0);
    const slotsPerPage = 6;
    const totalPages = Math.ceil(slots.length / slotsPerPage);
    const displayedSlots = slots.slice(currentPage * slotsPerPage, (currentPage + 1) * slotsPerPage);

    const goToPreviousPage = () => setCurrentPage((prev) => Math.max(0, prev - 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#002147] to-[#003366] px-6 py-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Availability Schedule</h2>
                  <p className="text-xs text-white/70 mt-0.5">{resource.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Resource Info Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Resource Code</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">{resource.resourceCode}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Resource Type</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{formatTypeLabel(resource.type)}</p>
                </div>
              </div>
            </div>

            {/* Date Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2 mb-3">
                <CalendarIcon size={14} /> Select Date
              </label>
              <input
                type="date"
                value={viewDate}
                min={getTodayDateString()}
                onChange={(e) => setViewDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] outline-none transition-all"
              />
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {formatDateForDisplay(viewDate)}
              </p>
            </div>

            {/* Time Slots Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Available Time Slots</p>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {slots.length} slots
                </span>
              </div>

              {slots.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-sm">No time slots available</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                    {displayedSlots.map((slot, index) => (
                      <div
                        key={`${slot.start}-${slot.end}-${index}`}
                        className="group relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 text-center hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                        <p className="text-sm font-medium text-green-800">{slot.label}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <div className="w-1 h-1 rounded-full bg-green-400"></div>
                          <p className="text-[10px] text-green-600">Available</p>
                          <div className="w-1 h-1 rounded-full bg-green-400"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-100">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 0}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          currentPage === 0
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <span className="text-xs text-slate-500">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages - 1}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          currentPage === totalPages - 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#002147] text-white font-medium rounded-xl hover:bg-[#001a3a] transition-colors shadow-lg shadow-[#002147]/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="resource-dashboard">
      {(showAddModal || showEditModal || showDetailsModal || showHolidayModal || selectedHoliday || showNoHolidayPopup || showAvailabilityModal) && (
        <div className="modal-backdrop" onClick={selectedHoliday ? closeHolidayPopup : showNoHolidayPopup ? closeNoHolidayPopup : showAvailabilityModal ? () => setShowAvailabilityModal(false) : undefined} />
      )}

      <header className="dashboard-header">
        <div className="header-left">
          <div className="brand-block">
            <div className="brand-logo-shell">
              <div className="brand-logo-inner">
                <img
                  src={logo}
                  alt="Northbridge University Logo"
                  className="brand-logo-image"
                />
              </div>
            </div>
            <div>
              <h1 className="brand-title">Northbridge</h1>
              <p className="brand-subtitle">Institutional Excellence</p>
            </div>
          </div>

          <nav className="header-nav">
            <a className="nav-link nav-link-active" href="#">
              Resources
            </a>
            <a 
              className="nav-link" 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/manager/resource/analysis';
              }}
            >
              Analytics
            </a>
          </nav>
        </div>

        <div className="header-right">
          <div className="user-block">
            <div className="user-meta">
              <p className="user-name">{localStorage.getItem('name') || 'Resource Manager'}</p>
              <p className="user-email">
                {localStorage.getItem('email') || 'resource.m@campus.com'}
              </p>
            </div>

            <button
              className="btn btn-outline btn-logout"
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                localStorage.removeItem('name');
                localStorage.removeItem('email');
                localStorage.removeItem('id');
                localStorage.removeItem('managerType');
                window.location.href = '/manager/login';
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="page-top">
          <div>
            <h2 className="page-title">Resource Inventory</h2>
            <p className="page-subtitle">
              Centralized oversight for institutional assets and facilities.
            </p>
          </div>

          <div className="top-actions">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button className="bg-[#002147] text-white rounded-r-xl hover:bg-blue-900 transition-colors flex items-center justify-center h-[48px] w-[48px] p-0">
                <Search size={20} className="block" />
              </button>
            </div>

            <button
              onClick={globalLock ? disableGlobalLock : enableGlobalLock}
              className={`btn btn-lock ${globalLock ? 'btn-enable-all' : 'btn-disable-all'}`}
            >
              {globalLock ? <Unlock size={18} /> : <Lock size={18} />}
              <span className="btn-text-hide-sm">{globalLock ? 'Enable All' : 'Disable All'}</span>
            </button>

            <button
              onClick={() => {
                setShowHolidayModal(true);
                fetchHolidays();
              }}
              className="btn btn-holiday"
            >
              <CalendarIcon size={18} />
              <span className="btn-text-hide-sm">Holidays</span>
            </button>

                  <button 
        className="btn btn-analysis"
        onClick={() => window.location.href = '/manager/resource/analysis'}
      >
        <BarChart3 size={18} />
        <span className="btn-text-hide-sm">Analysis</span>
      </button>

            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="btn btn-primary"
            >
              <Plus size={18} />
              <span className="btn-text-hide-sm">Add Resource</span>
            </button>
          </div>
        </div>

        {(globalLock || isHoliday) && (
          <div className="system-alert">
            {globalLock ? <Lock size={18} /> : <CalendarIcon size={18} />}
            {globalLock
              ? '🔒 SYSTEM LOCKED - All resources are currently unavailable due to emergency lock'
              : '🎉 HOLIDAY TODAY - All facilities are closed'}
          </div>
        )}

        {loading && (
          <div className="loading-wrap">
            <div className="loader"></div>
          </div>
        )}

        {!loading && (
          <div className="resource-grid">
            {filteredResources.map((resource) => {
              const fullImageUrl = getImageUrl(resource);
              const isUnavailableDueToLock = globalLock || isHoliday;

              return (
                <div
                  key={resource.id}
                  className={`resource-card ${isUnavailableDueToLock ? 'resource-card-muted' : ''}`}
                >
                  <div className="resource-image-wrap">
                    {fullImageUrl ? (
                      <img
                        src={fullImageUrl}
                        alt={resource.name}
                        className="resource-image"
                      />
                    ) : (
                      <div className="resource-no-image">
                        <span className="resource-no-image-icon">📦</span>
                        <p className="resource-no-image-text">No Image</p>
                      </div>
                    )}

                    <div className="resource-chip-left">
                      <span
                        className={`availability-chip ${
                          isUnavailableDueToLock || !resource.available
                            ? 'chip-unavailable'
                            : 'chip-available'
                        }`}
                      >
                        <span className="chip-dot"></span>
                        {isUnavailableDueToLock || !resource.available ? 'Unavailable' : 'Available'}
                      </span>
                    </div>

                    <div className="resource-chip-right">
                      {globalLock ? (
                        <span className="status-chip chip-locked">
                          <Lock size={10} /> LOCKED
                        </span>
                      ) : isHoliday ? (
                        <span className="status-chip chip-holiday">
                          <CalendarIcon size={10} /> HOLIDAY
                        </span>
                      ) : (
                        <span className={`status-chip ${getStatusColorClass(resource.status)}`}>
                          {getStatusText(resource.status)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="resource-card-body">
                    <div className="resource-heading">
                      <p className="resource-meta">
                        {resource.resourceCode} • {formatTypeLabel(resource.type)}
                      </p>
                      <p className="resource-meta" style={{ marginTop: '2px', color: '#002147' }}>
                        For: {resource.targetAudience}
                      </p>
                      <h3 className="resource-name">{resource.name}</h3>
                    </div>

                    <div className="resource-info-grid">
                      {resource.type !== 'EQUIPMENT' && (
                        <div className="info-item">
                          <Users size={14} className="info-icon" />
                          <div>
                            <p className="info-label">Capacity</p>
                            <p className="info-value">{resource.capacity}</p>
                          </div>
                        </div>
                      )}
                      <div className="info-item">
                        <MapPin size={14} className="info-icon" />
                        <div>
                          <p className="info-label">Location</p>
                          <p className="info-value truncate-text">{resource.location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="resource-action-row">
                      <button
                        onClick={() => openDetailsModal(resource)}
                        className="mini-btn mini-btn-blue"
                      >
                        <Info size={16} /> Details
                      </button>
                      <button
                        onClick={() => openEditModal(resource)}
                        className="mini-btn mini-btn-amber"
                      >
                        <Edit size={16} /> Edit
                      </button>
                    </div>

                    <button
                      onClick={() => openAvailabilityModal(resource)}
                      className="calendar-btn"
                      disabled={isUnavailableDueToLock}
                    >
                      <CalendarIcon size={16} /> View Availability
                    </button>

                    <div className="resource-footer">
                      <div className="resource-footer-actions">
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              resource.id,
                              resource.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE'
                            )
                          }
                          className="toggle-status-btn"
                          disabled={isUnavailableDueToLock}
                        >
                          Toggle Status
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="delete-icon-btn"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredResources.length === 0 && (
          <div className="empty-state">
            <p>No resources found</p>
          </div>
        )}
      </main>

      {/* Enhanced Professional Availability Modal */}
      {showAvailabilityModal && availabilityResource && (
        <AvailabilityViewerModal resource={availabilityResource} onClose={() => setShowAvailabilityModal(false)} />
      )}

      {showAddModal && (
        <div className="modal-center">
          <div className="modal-card modal-large">
            <div className="modal-header sticky-header">
              <h2 className="modal-title">Add New Resource</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="icon-close-btn"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="modal-form">
              <div>
                <label className="form-label">Resource Image</label>
                <div className="image-upload-row">
                  {imagePreview ? (
                    <div className="preview-wrap">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="preview-image"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="remove-preview-btn"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="upload-box">
                      <Upload size={28} className="upload-icon" />
                      <span className="upload-text">Upload</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleImageChange}
                        className="hidden-input"
                      />
                    </label>
                  )}
                  <p className="helper-text">Recommended: JPG or PNG, max 10MB</p>
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="form-label">Resource Code *</label>
                  <input
                    type="text"
                    name="resourceCode"
                    value={formData.resourceCode}
                    onChange={handleFormChange}
                    required
                    maxLength={6}
                    className={`input-field ${validationErrors.resourceCode ? 'error-input' : ''}`}
                    placeholder="e.g., LH101, ABC123"
                  />
                  {validationErrors.resourceCode && (
                    <p className="error-message">{validationErrors.resourceCode}</p>
                  )}
                  <small className="helper-text">Format: 1-3 CAPITAL letters + 3 digits (e.g., LH101)</small>
                </div>

                <div>
                  <label className="form-label">Resource Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    maxLength={100}
                    className={`input-field ${validationErrors.name ? 'error-input' : ''}`}
                    placeholder="e.g., Main Lecture Hall"
                  />
                  {validationErrors.name && (
                    <p className="error-message">{validationErrors.name}</p>
                  )}
                  <small className="helper-text">Letters and spaces only (no numbers)</small>
                </div>

                <div>
                  <label className="form-label">Resource Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    required
                    className="input-field"
                  >
                    {DEFAULT_RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {formatTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Visible To *</label>
                  <select
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleFormChange}
                    required
                    className="input-field"
                  >
                    {RESOURCE_AUDIENCE_OPTIONS.map((audience) => (
                      <option key={audience} value={audience}>
                        {audience}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.type !== 'EQUIPMENT' && (
                  <div>
                    <label className="form-label">Capacity *</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleFormChange}
                      required
                      min="1"
                      max="30000"
                      step="1"
                      className={`input-field ${validationErrors.capacity ? 'error-input' : ''}`}
                    />
                    {validationErrors.capacity && (
                      <p className="error-message">{validationErrors.capacity}</p>
                    )}
                    <small className="helper-text">Must be between 1 and 30,000</small>
                  </div>
                )}

                <div className="form-col-span-2">
                  <label className="form-label">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                    className={`input-field ${validationErrors.location ? 'error-input' : ''}`}
                    placeholder="e.g., Building A, Floor 1"
                  />
                  {validationErrors.location && (
                    <p className="error-message">{validationErrors.location}</p>
                  )}
                  <small className="helper-text">No restrictions - any characters allowed</small>
                </div>

                <AvailabilityEditor />

                <div className="form-col-span-2">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className={`input-field textarea-field ${validationErrors.description ? 'error-input' : ''}`}
                    placeholder="Resource description... (minimum 5 words)"
                  />
                  {validationErrors.description && (
                    <p className="error-message">{validationErrors.description}</p>
                  )}
                  <small className="helper-text">Minimum 5 words, numbers and letters allowed</small>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Adding...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-center">
          <div className="modal-card modal-large">
            <div className="modal-header sticky-header">
              <h2 className="modal-title">Edit Resource</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="icon-close-btn"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditResource} className="modal-form">
              <div>
                <label className="form-label">Resource Image</label>
                <div className="image-upload-row image-upload-wrap">
                  {imagePreview ? (
                    <div className="preview-wrap">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="preview-image"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="remove-preview-btn"
                      >
                        <X size={14} />
                      </button>
                      <p className="preview-note success-text">New Image</p>
                    </div>
                  ) : currentImageUrl ? (
                    <div className="preview-wrap">
                      <img
                        src={currentImageUrl}
                        alt="Current"
                        className="preview-image current-image"
                      />
                      <p className="preview-note muted-text">Current Image</p>
                    </div>
                  ) : (
                    <label className="upload-box">
                      <Upload size={28} className="upload-icon" />
                      <span className="upload-text">Upload Image</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleImageChange}
                        className="hidden-input"
                      />
                    </label>
                  )}

                  {(currentImageUrl || imagePreview) && (
                    <label className="change-image-link">
                      <Upload size={16} /> Change Image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleImageChange}
                        className="hidden-input"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="form-label">Resource Code *</label>
                  <input
                    type="text"
                    name="resourceCode"
                    value={formData.resourceCode}
                    onChange={handleFormChange}
                    required
                    maxLength={6}
                    className={`input-field ${validationErrors.resourceCode ? 'error-input' : ''}`}
                    placeholder="e.g., LH101, ABC123"
                  />
                  {validationErrors.resourceCode && (
                    <p className="error-message">{validationErrors.resourceCode}</p>
                  )}
                  <small className="helper-text">Format: 1-3 CAPITAL letters + 3 digits (e.g., LH101)</small>
                </div>

                <div>
                  <label className="form-label">Resource Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    maxLength={100}
                    className={`input-field ${validationErrors.name ? 'error-input' : ''}`}
                  />
                  {validationErrors.name && (
                    <p className="error-message">{validationErrors.name}</p>
                  )}
                  <small className="helper-text">Letters and spaces only (no numbers)</small>
                </div>

                <div>
                  <label className="form-label">Resource Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    required
                    className="input-field"
                  >
                    {getTypeOptions(formData.type).map((type) => (
                      <option key={type} value={type}>
                        {formatTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Visible To *</label>
                  <select
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleFormChange}
                    required
                    className="input-field"
                  >
                    {RESOURCE_AUDIENCE_OPTIONS.map((audience) => (
                      <option key={audience} value={audience}>
                        {audience}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.type !== 'EQUIPMENT' && (
                  <div>
                    <label className="form-label">Capacity *</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleFormChange}
                      required
                      min="1"
                      max="30000"
                      step="1"
                      className={`input-field ${validationErrors.capacity ? 'error-input' : ''}`}
                    />
                    {validationErrors.capacity && (
                      <p className="error-message">{validationErrors.capacity}</p>
                    )}
                    <small className="helper-text">Must be between 1 and 30,000</small>
                  </div>
                )}

                <div className="form-col-span-2">
                  <label className="form-label">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                    className={`input-field ${validationErrors.location ? 'error-input' : ''}`}
                  />
                  {validationErrors.location && (
                    <p className="error-message">{validationErrors.location}</p>
                  )}
                  <small className="helper-text">No restrictions - any characters allowed</small>
                </div>

                <AvailabilityEditor />

                <div className="form-col-span-2">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className={`input-field textarea-field ${validationErrors.description ? 'error-input' : ''}`}
                    placeholder="Resource description... (minimum 5 words)"
                  />
                  {validationErrors.description && (
                    <p className="error-message">{validationErrors.description}</p>
                  )}
                  <small className="helper-text">Minimum 5 words, numbers and letters allowed</small>
                </div>
              </div>

              <div className="form-grid form-grid-status">
                <div>
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="input-field"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Availability</label>
                  <select
                    name="available"
                    value={formData.available ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        available: e.target.value === 'true',
                      }))
                    }
                    className="input-field"
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Updating...' : 'Update Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && selectedResource && (
        <div className="modal-center">
          <div className="modal-card modal-large">
            <div className="modal-header sticky-header">
              <h2 className="modal-title">Resource Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="icon-close-btn"
              >
                <X size={24} />
              </button>
            </div>

            <div className="details-body">
              <div className="details-top">
                <div className="details-image-col">
                  {getImageUrl(selectedResource) ? (
                    <img
                      src={getImageUrl(selectedResource)!}
                      alt={selectedResource.name}
                      className="details-image"
                    />
                  ) : (
                    <div className="details-no-image">
                      <span className="details-no-image-icon">📦</span>
                      <p className="details-no-image-text">No Image</p>
                    </div>
                  )}
                </div>

                <div className="details-main">
                  <p className="details-meta">
                    {selectedResource.resourceCode} • {formatTypeLabel(selectedResource.type)}
                  </p>
                  <p className="details-meta" style={{ marginTop: '2px', color: '#002147' }}>
                    For: {selectedResource.targetAudience}
                  </p>
                  <h3 className="details-name">{selectedResource.name}</h3>

                  <div className="details-badges">
                    <span className={`status-chip ${getStatusColorClass(selectedResource.status)}`}>
                      {getStatusText(selectedResource.status)}
                    </span>
                    <span
                      className={`availability-state ${
                        selectedResource.available ? 'available-state' : 'unavailable-state'
                      }`}
                    >
                      {selectedResource.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div>
                    <label className="detail-label">Description</label>
                    <p className="detail-description">
                      {selectedResource.description || 'No description available'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="details-grid">
                <div className="details-card">
                  <label className="detail-label">Resource Code</label>
                  <p className="detail-value">{selectedResource.resourceCode}</p>
                </div>

                <div className="details-card">
                  <label className="detail-label">Resource Type</label>
                  <p className="detail-value">{formatTypeLabel(selectedResource.type)}</p>
                </div>

                <div className="details-card">
                  <label className="detail-label">Visible To</label>
                  <p className="detail-value">{selectedResource.targetAudience}</p>
                </div>

                <div className="details-card">
                  <label className="detail-label">Resource Name</label>
                  <p className="detail-value">{selectedResource.name}</p>
                </div>

                {selectedResource.type !== 'EQUIPMENT' && (
                  <div className="details-card">
                    <label className="detail-label">Capacity</label>
                    <p className="detail-value">{selectedResource.capacity}</p>
                  </div>
                )}

                <div className="details-card details-span-2">
                  <label className="detail-label">Location</label>
                  <p className="detail-value">{selectedResource.location}</p>
                </div>

                <div className="details-card">
                  <label className="detail-label">Created By</label>
                  <p className="detail-value">{selectedResource.createdBy || 'System'}</p>
                </div>

                <div className="details-card">
                  <label className="detail-label">Created Date</label>
                  <p className="detail-value">
                    {selectedResource.createdAt
                      ? new Date(selectedResource.createdAt).toLocaleString()
                      : 'Not available'}
                  </p>
                </div>

                <div className="details-card details-span-2">
                  <label className="detail-label">Updated Date</label>
                  <p className="detail-value">
                    {selectedResource.updatedAt
                      ? new Date(selectedResource.updatedAt).toLocaleString()
                      : 'Not available'}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-bottom-bar">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn btn-primary btn-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showHolidayModal && (
        <div className="modal-center">
          <div className="modal-card modal-medium">
            <div className="modal-header sticky-header">
              <h2 className="modal-title">Holiday Management</h2>
              <button
                onClick={() => setShowHolidayModal(false)}
                className="icon-close-btn"
              >
                <X size={24} />
              </button>
            </div>

            <div className="holiday-body">
              <form onSubmit={addHoliday} className="holiday-form">
                <h3 className="holiday-section-title">Add New Holiday</h3>

                <div className="holiday-form-grid">
                  <div>
                    <input
                      type="text"
                      name="holidayName"
                      placeholder="Holiday Name"
                      value={newHoliday.holidayName}
                      onChange={handleHolidayChange}
                      required
                      maxLength={100}
                      className={`input-field ${holidayValidationErrors.holidayName ? 'error-input' : ''}`}
                    />
                    {holidayValidationErrors.holidayName && (
                      <p className="error-message holiday-error">{holidayValidationErrors.holidayName}</p>
                    )}
                    <small className="helper-text">Letters, spaces, and hyphens only (no numbers or special characters)</small>
                  </div>

                  <div>
                    <input
                      type="date"
                      name="holidayDate"
                      value={newHoliday.holidayDate}
                      min={getTodayDateString()}
                      onChange={handleHolidayChange}
                      required
                      className={`input-field ${holidayValidationErrors.holidayDate ? 'error-input' : ''}`}
                    />
                    {holidayValidationErrors.holidayDate && (
                      <p className="error-message holiday-error">{holidayValidationErrors.holidayDate}</p>
                    )}
                    <small className="helper-text">Cannot select past dates</small>
                  </div>

                  <div>
                    <input
                      type="text"
                      name="description"
                      placeholder="Description (optional)"
                      value={newHoliday.description}
                      onChange={handleHolidayChange}
                      maxLength={500}
                      className={`input-field holiday-description-input ${holidayValidationErrors.holidayDesc ? 'error-input' : ''}`}
                    />
                    {holidayValidationErrors.holidayDesc && (
                      <p className="error-message holiday-error">{holidayValidationErrors.holidayDesc}</p>
                    )}
                    <small className="helper-text">Letters, numbers, spaces, and basic punctuation only (no special characters)</small>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={holidaySubmitting}
                  className="btn btn-primary holiday-submit-btn"
                >
                  {holidaySubmitting ? 'Adding...' : 'Add Holiday'}
                </button>
              </form>

              <div>
                <h3 className="holiday-section-title">Holidays Calendar</h3>
                <div className="calendar-wrapper">
                  <Calendar
                    onChange={handleDateClick}
                    value={selectedDate}
                    tileClassName={tileClassName}
                    tileContent={tileContent}
                    minDate={new Date()}
                    formatMonthYear={(locale, date) => `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`}
                  />
                </div>
                
                {holidays.length === 0 && (
                  <p className="holiday-empty" style={{textAlign: 'center', marginTop: '1rem'}}>No holidays added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedHoliday && (
        <div className="modal-center holiday-popup" onClick={(e) => e.stopPropagation()}>
          <div className="modal-card modal-small">
            <div className="modal-header">
              <h2 className="modal-title">Holiday Details</h2>
              <button onClick={closeHolidayPopup} className="icon-close-btn">
                <X size={24} />
              </button>
            </div>
            <div className="holiday-popup-content">
              <p><strong>Name:</strong> {selectedHoliday.holiday_name || selectedHoliday.holidayName}</p>
              <p><strong>Date:</strong> {formatHolidayDate(selectedHoliday.holiday_date || selectedHoliday.holidayDate || '')}</p>
              {selectedHoliday.description && <p><strong>Description:</strong> {selectedHoliday.description}</p>}
            </div>
            <div className="modal-footer">
              <button onClick={closeHolidayPopup} className="btn btn-primary btn-full">Close</button>
            </div>
          </div>
        </div>
      )}

      {showNoHolidayPopup && noHolidayDate && (
        <div className="modal-center no-holiday-popup" onClick={(e) => e.stopPropagation()}>
          <div className="modal-card modal-small">
            <div className="modal-header">
              <h2 className="modal-title">No Holiday</h2>
              <button onClick={closeNoHolidayPopup} className="icon-close-btn">
                <X size={24} />
              </button>
            </div>
            <div className="no-holiday-popup-content">
              <div className="no-holiday-icon">📅</div>
              <p className="no-holiday-message">
                <strong>{noHolidayDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </p>
              <p>No holiday is scheduled on this date.</p>
              <p className="no-holiday-suggestion">You can add a holiday using the form above.</p>
            </div>
            <div className="modal-footer">
              <button onClick={closeNoHolidayPopup} className="btn btn-primary btn-full">Close</button>
            </div>
          </div>
        </div>
      )}

      <footer className="dashboard-footer">
        <div className="footer-left">
          <p className="footer-copy">© 2026 Northbridge University. All Rights Reserved.</p>
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link">
            Institutional Guidelines
          </a>
          <a href="#" className="footer-link">
            Privacy Policy
          </a>
          <a href="#" className="footer-link">
            Technical Support
          </a>
        </div>
      </footer>
    </div>
  );
};

export default ResourceDashboard;