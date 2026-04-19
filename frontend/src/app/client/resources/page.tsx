// src/app/client/resource-catalogue/page.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search,
  X,
  Info,
  Calendar,
  MapPin,
  Users,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';
import type { Resource } from '../../../types/resource.types';

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

interface AvailabilityConfig {
  mode: 'FIXED_DAILY';
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

const API_BASE_URL = 'http://localhost:8081/api/resource-manager';

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

const ResourceCataloguePage: React.FC = () => {
  const navigate = useNavigate();

  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showAvailabilityId, setShowAvailabilityId] = useState<number | null>(null);
  const [availabilityViewDate, setAvailabilityViewDate] = useState<string>(getTodayDateString());
  const [loading, setLoading] = useState(true);

  const normalizeResource = (resource: ResourceApi): Resource => {
    return {
      id: resource.id,
      resourceCode: resource.resourceCode || resource.resource_code || '',
      name: resource.name || '',
      type: resource.type || 'LECTURE_HALL',
      targetAudience: (resource as any).targetAudience || (resource as any).target_audience || 'BOTH',
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

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const role = (localStorage.getItem('role') || '').toUpperCase();
      const audience = role === 'LECTURER' ? 'LECTURER' : 'STUDENT';
      const response = await axios.get(`${API_BASE_URL}/resources/client/${audience}`);
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

  const openDetailsModal = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDetailsModal(true);
  };

  const toggleAvailabilityView = (resourceId: number) => {
    setShowAvailabilityId(showAvailabilityId === resourceId ? null : resourceId);
    setAvailabilityViewDate(getTodayDateString());
  };

  const handleBookNow = (resource: Resource) => {
    navigate('/client/resourceBooking', {
      state: {
        resourceId: resource.id,
        resourceCode: resource.resourceCode,
        resourceName: resource.name,
        resourceType: resource.type,
      },
    });
  };

  const filteredResources = resources.filter((resource) => {
    const code = resource.resourceCode || '';
    const name = resource.name || '';
    const type = resource.type || '';
    const location = resource.location || '';

    return (
      searchTerm === '' ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase())
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

  const AvailabilityViewer = ({ resource }: { resource: Resource }) => {
    const config = parseAvailabilityConfig(resource.availabilityWindows);
    const slots = generateTimeSlots(config);

    return (
      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
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
          <p className="text-sm text-slate-600 mt-2">
            {formatDateForDisplay(availabilityViewDate)}
          </p>
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
      {/* Header Component */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 px-12 py-10 max-w-[1600px] mx-auto w-full relative z-10 mt-20">
        <div className="flex justify-between items-end mb-12 border-b border-slate-200/50 pb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-5xl font-['Newsreader'] font-bold text-[#002147] tracking-tight">
              Resource Catalogue
            </h2>
            <p className="text-slate-500 mt-2 text-lg">
              Browse available university resources and proceed to booking.
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
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002147]"></div>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 items-start md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
            {filteredResources.map((resource) => {
              const fullImageUrl = getImageUrl(resource);

              return (
                <div
                  key={resource.id}
                  className="group self-start bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 flex flex-col hover:shadow-xl hover:border-[#002147]/20 transition-all duration-300"
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

                  <div className="p-6 flex flex-col">
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
                        onClick={() => handleBookNow(resource)}
                        className="flex-1 py-2.5 px-3 bg-amber-50 text-amber-700 font-semibold rounded-xl text-sm hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <BookOpen size={16} /> Book
                      </button>
                    </div>

                    <button
                      onClick={() => toggleAvailabilityView(resource.id)}
                      className="w-full py-2.5 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Calendar size={16} /> View Availability Calendar
                    </button>

                    {showAvailabilityId === resource.id && <AvailabilityViewer resource={resource} />}
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

      {/* Details Modal */}
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

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default ResourceCataloguePage;