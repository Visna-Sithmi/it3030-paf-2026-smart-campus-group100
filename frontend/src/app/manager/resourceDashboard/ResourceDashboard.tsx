import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
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
  Calendar,
  MapPin,
  Users,
  Shield,
  Lock,
  Unlock,
} from 'lucide-react';
import logo from '../../../assets/logo.jpeg';
import './resourceDashboard.css';

interface ResourceApi {
  id: number;
  resourceCode?: string;
  resource_code?: string;
  name: string;
  type: string;
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
  holiday_name: string;   // snake_case from backend
  holidayName?: string;   // for compatibility
  holiday_date: string;   // snake_case from backend
  holidayDate?: string;   // for compatibility
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

// Add this helper function
const formatHolidayDate = (dateString: string) => {
  if (!dateString) return 'Invalid Date';
  try {
    // Handle different date formats
    let date: Date;
    if (dateString.includes('-')) {
      // Format: 2026-12-25
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
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

const normalizeDateForBackend = (dateValue: string) => {
  if (!dateValue) return '';
  return dateValue;
};

const ResourceDashboard: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showAvailabilityId, setShowAvailabilityId] = useState<number | null>(null);
  const [availabilityViewDate, setAvailabilityViewDate] = useState<string>(getTodayDateString());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const normalizeResource = (resource: ResourceApi): Resource => {
    return {
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
  };

  const resetHolidayForm = () => {
    setNewHoliday({
      holidayName: '',
      holidayDate: '',
      description: '',
    });
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

  if (!newHoliday.holidayName.trim()) {
    alert('Holiday name is required');
    return;
  }

  if (!newHoliday.holidayDate) {
    alert('Holiday date is required');
    return;
  }

  setHolidaySubmitting(true);

  try {
    // Ensure date is in YYYY-MM-DD format
    const formattedDate = newHoliday.holidayDate; // Input date is already YYYY-MM-DD
    
    const holidayData = {
      holidayName: newHoliday.holidayName.trim(),
      holidayDate: formattedDate,
      description: newHoliday.description.trim(),
    };

    console.log('Sending holiday data:', holidayData);

    const response = await api.post<ApiResponse<any>>('/holidays/add', holidayData);

    if (response.data.success) {
      alert(response.data.message || 'Holiday added successfully');
      resetHolidayForm();
      await Promise.all([fetchHolidays(), fetchResources(), checkSystemStatus()]);
    } else {
      alert(response.data.message || 'Failed to add holiday');
    }
  } catch (error) {
    console.error('Error adding holiday:', error);
    alert(getErrorMessage(error, 'Failed to add holiday'));
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
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();

      const resourceForBackend = {
        resource_code: formData.resourceCode,
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
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
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();

      const resourceForBackend: any = {
        resource_code: formData.resourceCode,
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
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
    setShowEditModal(true);
  };

  const openDetailsModal = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDetailsModal(true);
  };

  const toggleAvailabilityView = (resourceId: number) => {
    setShowAvailabilityId(showAvailabilityId === resourceId ? null : resourceId);
    setAvailabilityViewDate(getTodayDateString());
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
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

  const AvailabilityViewer = ({ resource }: { resource: Resource }) => {
    const config = parseAvailabilityConfig(resource.availabilityWindows);
    const slots = generateTimeSlots(config);

    return (
      <div className="availability-viewer">
        <div className="availability-viewer-top">
          <label className="mini-label">Choose Date</label>
          <input
            type="date"
            value={availabilityViewDate}
            onChange={(e) => setAvailabilityViewDate(e.target.value)}
            className="input-field"
          />
          <p className="availability-view-date">{formatDateForDisplay(availabilityViewDate)}</p>
        </div>

        <div className="availability-header-row">
          <p className="availability-title">All Available Time Slots</p>
          <span className="availability-count">{slots.length} slots</span>
        </div>

        <div className="slot-grid slot-grid-two">
          {slots.map((slot, index) => (
            <div
              key={`${slot.start}-${slot.end}-${index}`}
              className="slot-badge"
            >
              {slot.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="resource-dashboard">
      {(showAddModal || showEditModal || showDetailsModal || showHolidayModal) && (
        <div className="modal-backdrop" />
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
            <a className="nav-link" href="#">
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
              <Calendar size={18} />
              <span className="btn-text-hide-sm">Holidays</span>
            </button>

            <button className="btn btn-analysis">
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
            <Shield size={18} />
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
                          <Calendar size={10} /> HOLIDAY
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
                      <h3 className="resource-name">{resource.name}</h3>
                    </div>

                    <div className="resource-info-grid">
                      <div className="info-item">
                        <Users size={14} className="info-icon" />
                        <div>
                          <p className="info-label">Capacity</p>
                          <p className="info-value">{resource.capacity}</p>
                        </div>
                      </div>
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
                      onClick={() => toggleAvailabilityView(resource.id)}
                      className="calendar-btn"
                      disabled={isUnavailableDueToLock}
                    >
                      <Calendar size={16} /> View Availability Calendar
                    </button>

                    {showAvailabilityId === resource.id && !isUnavailableDueToLock && (
                      <AvailabilityViewer resource={resource} />
                    )}

                    {showAvailabilityId === resource.id && isUnavailableDueToLock && (
                      <div className="availability-disabled">
                        <p>
                          Availability calendar is disabled due to{' '}
                          {globalLock ? 'emergency lock' : 'holiday closure'}.
                        </p>
                      </div>
                    )}

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
                        accept="image/*"
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
                    className="input-field"
                    placeholder="e.g., LH101"
                  />
                </div>

                <div>
                  <label className="form-label">Resource Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="input-field"
                    placeholder="e.g., Main Lecture Hall"
                  />
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
                  <label className="form-label">Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleFormChange}
                    required
                    min="0"
                    className="input-field"
                  />
                </div>

                <div className="form-col-span-2">
                  <label className="form-label">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                    className="input-field"
                    placeholder="e.g., Building A, Floor 1"
                  />
                </div>

                <AvailabilityEditor />

                <div className="form-col-span-2">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="input-field textarea-field"
                    placeholder="Resource description..."
                  />
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
                        accept="image/*"
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
                        accept="image/*"
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
                    className="input-field"
                    placeholder="e.g., LH101"
                  />
                </div>

                <div>
                  <label className="form-label">Resource Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="input-field"
                  />
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
                  <label className="form-label">Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleFormChange}
                    required
                    min="0"
                    className="input-field"
                  />
                </div>

                <div className="form-col-span-2">
                  <label className="form-label">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                    className="input-field"
                  />
                </div>

                <AvailabilityEditor />

                <div className="form-col-span-2">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="input-field textarea-field"
                    placeholder="Resource description..."
                  />
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
                  <label className="detail-label">Resource Name</label>
                  <p className="detail-value">{selectedResource.name}</p>
                </div>

                <div className="details-card">
                  <label className="detail-label">Capacity</label>
                  <p className="detail-value">{selectedResource.capacity}</p>
                </div>

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
            <input
              type="text"
              placeholder="Holiday Name"
              value={newHoliday.holidayName}
              onChange={(e) =>
                setNewHoliday((prev) => ({ ...prev, holidayName: e.target.value }))
              }
              required
              className="input-field"
            />

            <input
              type="date"
              value={newHoliday.holidayDate}
              onChange={(e) =>
                setNewHoliday((prev) => ({ ...prev, holidayDate: e.target.value }))
              }
              required
              className="input-field"
            />

            <input
              type="text"
              placeholder="Description (optional)"
              value={newHoliday.description}
              onChange={(e) =>
                setNewHoliday((prev) => ({ ...prev, description: e.target.value }))
              }
              className="input-field holiday-description-input"
            />
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
          <h3 className="holiday-section-title">Holidays List</h3>
          <div className="holiday-list">
            {holidays.map((holiday) => {
              // Get values from either snake_case or camelCase
              const holidayName = holiday.holiday_name || holiday.holidayName;
              const holidayDate = holiday.holiday_date || holiday.holidayDate;
              
              return (
                <div key={holiday.id} className="holiday-item">
                  <div>
                    <p className="holiday-name">{holidayName}</p>
                    <p className="holiday-date">
                      {(() => {
                        if (!holidayDate) return 'No date';
                        // Parse YYYY-MM-DD format manually
                        const parts = holidayDate.split('-');
                        if (parts.length === 3) {
                          const date = new Date(
                            parseInt(parts[0]), 
                            parseInt(parts[1]) - 1, 
                            parseInt(parts[2])
                          );
                          return date.toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        }
                        return holidayDate;
                      })()}
                    </p>
                    {holiday.description && (
                      <p className="holiday-description">{holiday.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteHoliday(holiday.id)}
                    className="holiday-delete-btn"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}

            {holidays.length === 0 && (
              <p className="holiday-empty">No holidays added yet</p>
            )}
          </div>
        </div>
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