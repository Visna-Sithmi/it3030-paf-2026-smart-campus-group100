// src/components/ResourceDashboard.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
} from 'lucide-react';

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

const API_BASE_URL = 'http://localhost:8081/api/resource-manager';

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

  const [availabilityConfig, setAvailabilityConfig] = useState<AvailabilityConfig>(
    DEFAULT_AVAILABILITY_CONFIG
  );
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
    availabilityWindows:
      resource.availabilityWindows || resource.availability_windows || '',
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

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      availabilityWindows: buildAvailabilityString(availabilityConfig),
    }));
  }, [availabilityConfig]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/resources/all`);
      if (response.data.success) {
        const normalizedResources = (response.data.data || []).map((item: ResourceApi) =>
          normalizeResource(item)
        );
        setResources(normalizedResources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

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
        alert('Resource added successfully!');
      }
    } catch (error: any) {
      console.error('Error adding resource:', error);
      alert(error.response?.data?.message || 'Failed to add resource');
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
        alert('Resource updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating resource:', error);
      alert(error.response?.data?.message || 'Failed to update resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/resources/status/${id}?status=${status}`);
      if (response.data.success) {
        await fetchResources();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteResource = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/resources/delete/${id}`);
        if (response.data.success) {
          await fetchResources();
        }
      } catch (error) {
        console.error('Error deleting resource:', error);
      }
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
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-600';
      case 'OUT_OF_SERVICE':
        return 'bg-red-600';
      case 'MAINTENANCE':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
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
    <div className="col-span-2">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Availability Schedule
      </label>

      <div className="border border-slate-300 rounded-2xl p-5 bg-slate-50 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              Start Time
            </label>
            <input
              type="time"
              value={availabilityConfig.startTime}
              onChange={(e) =>
                setAvailabilityConfig((prev) => ({
                  ...prev,
                  startTime: e.target.value,
                }))
              }
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              End Time
            </label>
            <input
              type="time"
              value={availabilityConfig.endTime}
              onChange={(e) =>
                setAvailabilityConfig((prev) => ({
                  ...prev,
                  endTime: e.target.value,
                }))
              }
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              Slot Duration
            </label>
            <select
              value={availabilityConfig.slotDurationMinutes}
              onChange={(e) =>
                setAvailabilityConfig((prev) => ({
                  ...prev,
                  slotDurationMinutes: Number(e.target.value),
                }))
              }
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value={60}>60 minutes</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            Select Date to Preview Slots
          </label>
          <input
            type="date"
            value={availabilityFormDate}
            onChange={(e) => setAvailabilityFormDate(e.target.value)}
            className="w-full md:w-[260px] px-4 py-2.5 border border-slate-300 rounded-xl bg-white"
          />
          <p className="text-sm text-slate-500 mt-2">
            {formatDateForDisplay(availabilityFormDate)}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#002147]">Available Time Slots</p>
            <span className="text-xs text-slate-500">
              {availabilitySlotsForForm.length} slots per day
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availabilitySlotsForForm.map((slot, index) => (
              <div
                key={`${slot.start}-${slot.end}-${index}`}
                className="px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-green-800 text-sm font-medium"
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
      <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            Choose Date
          </label>
          <input
            type="date"
            value={availabilityViewDate}
            onChange={(e) => setAvailabilityViewDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white"
          />
          <p className="text-sm text-slate-600 mt-2">{formatDateForDisplay(availabilityViewDate)}</p>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#002147]">All Available Time Slots</p>
          <span className="text-xs text-slate-500">{slots.length} slots</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {slots.map((slot, index) => (
            <div
              key={`${slot.start}-${slot.end}-${index}`}
              className="px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-green-800 text-sm font-medium"
            >
              {slot.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {(showAddModal || showEditModal || showDetailsModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      )}

      <header className="flex justify-between items-center w-full px-12 h-24 bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200 z-30 relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#002147] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">NU</span>
            </div>
            <div>
              <h1 className="font-['Newsreader'] text-2xl font-bold tracking-tight text-[#002147] leading-none">
                Northbridge
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
                Institutional Excellence
              </p>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-8 ml-10">
            <a className="text-[#002147] font-semibold border-b-2 border-[#002147] pb-1" href="#">
              Resources
            </a>
            <a className="text-slate-500 hover:text-[#002147] transition-colors" href="#">
              Analytics
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-sm text-[#002147]">Dr. Alistair Thorne</p>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">
                Chancellor Administrator
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs hover:bg-slate-50 transition-colors uppercase tracking-widest">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-12 py-10 max-w-[1600px] mx-auto w-full relative z-10">
        <div className="flex justify-between items-end mb-12 border-b border-slate-200/50 pb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-5xl font-['Newsreader'] font-bold text-[#002147] tracking-tight">
              Resource Inventory
            </h2>
            <p className="text-slate-500 mt-2 text-lg">
              Centralized oversight for institutional assets and facilities.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-slate-200 focus:ring-2 focus:ring-[#002147] rounded-xl pl-5 pr-4 py-3 text-sm w-64 h-[48px]"
              />
              <button className="bg-[#002147] text-white px-4 py-2 rounded-r-xl hover:bg-blue-900 transition-colors flex items-center h-[48px] rounded-l-none">
                <Search size={20} />
              </button>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#191c1e] font-semibold rounded-xl hover:bg-slate-100 transition-colors h-[48px] shadow-sm">
              <BarChart3 size={18} /> View Analysis
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-[#002147] text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 hover:opacity-90 transition-colors h-[48px]"
            >
              <Plus size={18} /> Add Resource
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002147]"></div>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
            {filteredResources.map((resource) => {
              const fullImageUrl = getImageUrl(resource);

              return (
                <div
                  key={resource.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 flex flex-col h-full hover:shadow-xl hover:border-[#002147]/20 transition-all duration-300"
                >
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {fullImageUrl ? (
                      <img
                        src={fullImageUrl}
                        alt={resource.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <span className="text-6xl opacity-30">📦</span>
                        <p className="text-sm text-slate-400 mt-2">No Image</p>
                      </div>
                    )}

                    <div className="absolute top-4 left-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 ${
                          resource.available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        {resource.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-md ${getStatusColor(
                          resource.status
                        )}`}
                      >
                        {getStatusText(resource.status)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#002147]/60 mb-1">
                        {resource.resourceCode} • {formatTypeLabel(resource.type)}
                      </p>
                      <h3 className="text-2xl font-['Newsreader'] font-bold text-[#002147]">
                        {resource.name}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-slate-400" />
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Capacity</p>
                          <p className="text-sm font-medium">{resource.capacity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Location</p>
                          <p className="text-sm font-medium truncate">{resource.location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => openDetailsModal(resource)}
                        className="flex-1 py-2.5 px-3 bg-blue-50 text-blue-700 font-semibold rounded-xl text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Info size={16} /> Details
                      </button>
                      <button
                        onClick={() => openEditModal(resource)}
                        className="flex-1 py-2.5 px-3 bg-amber-50 text-amber-700 font-semibold rounded-xl text-sm hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit size={16} /> Edit
                      </button>
                    </div>

                    <button
                      onClick={() => toggleAvailabilityView(resource.id)}
                      className="w-full py-2.5 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors mb-4 flex items-center justify-center gap-2"
                    >
                      <Calendar size={16} /> View Availability Calendar
                    </button>

                    {showAvailabilityId === resource.id && <AvailabilityViewer resource={resource} />}

                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <div className="flex justify-end items-center">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                resource.id,
                                resource.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE'
                              )
                            }
                            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Toggle Status
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredResources.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">No resources found</p>
          </div>
        )}
      </main>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-['Newsreader'] font-bold text-[#002147]">
                Add New Resource
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Resource Image
                </label>
                <div className="flex items-center gap-6">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-28 h-28 object-cover rounded-xl shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-28 h-28 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#002147] hover:bg-slate-50 transition-all">
                      <Upload size={28} className="text-slate-400" />
                      <span className="text-xs text-slate-500 mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-xs text-slate-400">Recommended: JPG or PNG, max 10MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Resource Code *
                  </label>
                  <input
                    type="text"
                    name="resourceCode"
                    value={formData.resourceCode}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002147]"
                    placeholder="e.g., LH101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Resource Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002147]"
                    placeholder="e.g., Main Lecture Hall"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Resource Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002147]"
                  >
                    {DEFAULT_RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {formatTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleFormChange}
                    required
                    min="0"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl"
                    placeholder="e.g., Building A, Floor 1"
                  />
                </div>

                <AvailabilityEditor />

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl"
                    placeholder="Resource description..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#002147] text-white font-semibold rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 shadow-md"
                >
                  {submitting ? 'Adding...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-['Newsreader'] font-bold text-[#002147]">
                Edit Resource
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditResource} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Resource Image
                </label>
                <div className="flex items-center gap-6 flex-wrap">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-28 h-28 object-cover rounded-xl shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                      >
                        <X size={14} />
                      </button>
                      <p className="text-xs text-green-600 mt-1 text-center">New Image</p>
                    </div>
                  ) : currentImageUrl ? (
                    <div className="relative">
                      <img
                        src={currentImageUrl}
                        alt="Current"
                        className="w-28 h-28 object-cover rounded-xl shadow-md border-2 border-[#002147]/20"
                      />
                      <p className="text-xs text-slate-400 mt-1 text-center">Current Image</p>
                    </div>
                  ) : (
                    <label className="w-28 h-28 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#002147] hover:bg-slate-50 transition-all">
                      <Upload size={28} className="text-slate-400" />
                      <span className="text-xs text-slate-500 mt-1">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}

                  {(currentImageUrl || imagePreview) && (
                    <label className="cursor-pointer text-sm text-[#002147] font-semibold hover:underline flex items-center gap-2">
                      <Upload size={16} /> Change Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Resource Code *
                  </label>
                  <input
                    type="text"
                    name="resourceCode"
                    value={formData.resourceCode}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002147]"
                    placeholder="e.g., LH101"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Resource code identifies the resource uniquely
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Resource Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002147]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Resource Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002147]"
                  >
                    {getTypeOptions(formData.type).map((type) => (
                      <option key={type} value={type}>
                        {formatTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleFormChange}
                    required
                    min="0"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <AvailabilityEditor />

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl"
                    placeholder="Resource description..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002147]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Availability
                  </label>
                  <select
                    name="available"
                    value={formData.available ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        available: e.target.value === 'true',
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002147]"
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#002147] text-white font-semibold rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 shadow-md"
                >
                  {submitting ? 'Updating...' : 'Update Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  {showDetailsModal && selectedResource && (
  <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center z-10">
        <h2 className="text-2xl font-['Newsreader'] font-bold text-[#002147]">
          Resource Details
        </h2>
        <button
          onClick={() => setShowDetailsModal(false)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-[260px] shrink-0">
            {getImageUrl(selectedResource) ? (
              <img
                src={getImageUrl(selectedResource)!}
                alt={selectedResource.name}
                className="w-full h-[220px] object-cover rounded-2xl shadow-md border border-slate-200"
              />
            ) : (
              <div className="w-full h-[220px] bg-slate-100 rounded-2xl flex flex-col items-center justify-center border border-slate-200">
                <span className="text-5xl opacity-30">📦</span>
                <p className="text-sm text-slate-400 mt-2">No Image</p>
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#002147]/60 mb-2">
              {selectedResource.resourceCode} • {formatTypeLabel(selectedResource.type)}
            </p>
            <h3 className="text-4xl font-['Newsreader'] font-bold text-[#002147] mb-4">
              {selectedResource.name}
            </h3>

            <div className="flex flex-wrap gap-3 mb-5">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(
                  selectedResource.status
                )}`}
              >
                {getStatusText(selectedResource.status)}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedResource.available
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {selectedResource.available ? 'Available' : 'Unavailable'}
              </span>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Description
              </label>
              <p className="mt-2 text-slate-700 leading-7">
                {selectedResource.description || 'No description available'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Resource Code
            </label>
            <p className="mt-2 text-base font-semibold text-slate-800">
              {selectedResource.resourceCode}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Resource Type
            </label>
            <p className="mt-2 text-base font-semibold text-slate-800">
              {formatTypeLabel(selectedResource.type)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Resource Name
            </label>
            <p className="mt-2 text-base font-semibold text-slate-800">
              {selectedResource.name}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Capacity
            </label>
            <p className="mt-2 text-base font-semibold text-slate-800">
              {selectedResource.capacity}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Location
            </label>
            <p className="mt-2 text-base font-semibold text-slate-800">
              {selectedResource.location}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Created By
            </label>
            <p className="mt-2 text-base font-semibold text-slate-800">
              {selectedResource.createdBy || 'System'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Created Date
            </label>
            <p className="mt-2 text-base font-semibold text-slate-800">
              {selectedResource.createdAt
                ? new Date(selectedResource.createdAt).toLocaleString()
                : 'Not available'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Updated Date
            </label>
            <p className="mt-2 text-base font-semibold text-slate-800">
              {selectedResource.updatedAt
                ? new Date(selectedResource.updatedAt).toLocaleString()
                : 'Not available'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 p-6">
        <button
          onClick={() => setShowDetailsModal(false)}
          className="w-full px-6 py-3 bg-[#002147] text-white rounded-xl hover:opacity-90 transition-colors shadow-md font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      <footer className="flex flex-col md:flex-row justify-between items-center py-8 px-12 border-t border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <div className="mb-4 md:mb-0">
          <p className="text-xs uppercase tracking-widest text-slate-500">
            © 2024 Northbridge University. All Rights Reserved.
          </p>
        </div>
        <div className="flex gap-8">
          <a
            href="#"
            className="text-xs uppercase tracking-widest text-slate-500 hover:text-[#002147] underline transition-opacity"
          >
            Institutional Guidelines
          </a>
          <a
            href="#"
            className="text-xs uppercase tracking-widest text-slate-500 hover:text-[#002147] underline transition-opacity"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-xs uppercase tracking-widest text-slate-500 hover:text-[#002147] underline transition-opacity"
          >
            Technical Support
          </a>
        </div>
      </footer>
    </div>
  );
};

export default ResourceDashboard;