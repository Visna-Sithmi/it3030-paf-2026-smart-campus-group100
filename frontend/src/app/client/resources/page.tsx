// src/app/client/resource-catalogue/page.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  Search,
  X,
  Info,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  BookOpen,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';
import type { Resource } from '../../../types/resource.types';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

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

const ResourceCataloguePage: React.FC = () => {
  const navigate = useNavigate();

  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Availability Popup State
  const [showAvailabilityPopup, setShowAvailabilityPopup] = useState(false);
  const [selectedAvailabilityResource, setSelectedAvailabilityResource] = useState<Resource | null>(null);
  const [availabilityViewDate, setAvailabilityViewDate] = useState<string>(getTodayDateString());
  
  // Holiday Calendar State
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [showNoHolidayPopup, setShowNoHolidayPopup] = useState(false);
  const [noHolidayDate, setNoHolidayDate] = useState<Date | null>(null);

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

  const fetchHolidays = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/holidays/all`);
      if (response.data.success) {
        setHolidays(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchHolidays();
  }, []);

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

  const openDetailsModal = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDetailsModal(true);
  };

  const openAvailabilityPopup = (resource: Resource) => {
    setSelectedAvailabilityResource(resource);
    setAvailabilityViewDate(getTodayDateString());
    setShowAvailabilityPopup(true);
  };

  const closeAvailabilityPopup = () => {
    setShowAvailabilityPopup(false);
    setSelectedAvailabilityResource(null);
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

  // Calendar helper functions
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

  const closeHolidayPopup = () => {
    setSelectedHoliday(null);
  };

  const closeNoHolidayPopup = () => {
    setShowNoHolidayPopup(false);
    setNoHolidayDate(null);
  };

  const closeHolidayModal = () => {
    setShowHolidayModal(false);
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const holiday = getHolidayForDate(date);
      if (holiday) {
        return 'client-holiday-tile';
      }
    }
    return null;
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const holiday = getHolidayForDate(date);
      if (holiday) {
        return <div className="client-holiday-dot"></div>;
      }
    }
    return null;
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

  const AvailabilityPopupContent = () => {
    if (!selectedAvailabilityResource) return null;
    
    const config = parseAvailabilityConfig(selectedAvailabilityResource.availabilityWindows);
    const slots = generateTimeSlots(config);

    return (
      <div className="p-5">
        {/* Compact Resource Info */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock size={16} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 text-sm truncate">{selectedAvailabilityResource.name}</h3>
            <p className="text-xs text-slate-400">{selectedAvailabilityResource.resourceCode}</p>
          </div>
        </div>
        
        {/* Date Picker - Compact */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
            Select Date
          </label>
          <input
            type="date"
            value={availabilityViewDate}
            min={getTodayDateString()}
            onChange={(e) => setAvailabilityViewDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#002147] focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            {formatDateForDisplay(availabilityViewDate)}
          </p>
        </div>

        {/* Time Slots - Compact */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#002147]">Available Time Slots</p>
          <span className="text-xs text-slate-400">{slots.length} slots</span>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {slots.length > 0 ? (
            slots.map((slot, index) => (
              <div
                key={`${slot.start}-${slot.end}-${index}`}
                className="px-2 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 text-xs font-medium text-center hover:bg-green-100 transition-colors cursor-pointer"
              >
                {slot.label}
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-6 text-slate-400 text-sm">
              No available slots for this date
            </div>
          )}
        </div>

        {/* Buttons - Compact */}
        <div className="flex gap-2 pt-4 mt-2 border-t border-slate-100">
          <button
            onClick={closeAvailabilityPopup}
            className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            Close
          </button>
          <button
            onClick={() => {
              closeAvailabilityPopup();
              handleBookNow(selectedAvailabilityResource);
            }}
            disabled={!selectedAvailabilityResource.available}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              selectedAvailabilityResource.available
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Book Now
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modal Backdrop */}
      {(showDetailsModal || showHolidayModal || selectedHoliday || showNoHolidayPopup || showAvailabilityPopup) && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={selectedHoliday ? closeHolidayPopup : showNoHolidayPopup ? closeNoHolidayPopup : showHolidayModal ? closeHolidayModal : showAvailabilityPopup ? closeAvailabilityPopup : undefined}
        />
      )}

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
            
            {/* Holidays Button */}
            <button
              onClick={() => {
                setShowHolidayModal(true);
                fetchHolidays();
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
            >
              <CalendarIcon size={18} />
              <span>Holidays</span>
            </button>
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
              const isEquipment = resource.type === 'EQUIPMENT';

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

                    {/* Resource Info Grid - Hide Capacity for EQUIPMENT */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {!isEquipment && (
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-slate-400" />
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Capacity</p>
                            <p className="text-sm font-medium">{resource.capacity}</p>
                          </div>
                        </div>
                      )}
                      <div className={`flex items-center gap-2 ${isEquipment ? 'col-span-2' : ''}`}>
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
                        disabled={!resource.available}
                        className={`flex-1 py-2.5 px-3 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors ${
                          resource.available
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <BookOpen size={16} /> Book
                      </button>
                    </div>

                    <button
                      onClick={() => openAvailabilityPopup(resource)}
                      className="w-full py-2.5 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <CalendarIcon size={16} /> View Availability Calendar
                    </button>
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

      {/* Availability Popup Modal - Compact Size */}
      {showAvailabilityPopup && selectedAvailabilityResource && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl animate-slideIn overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                  <CalendarIcon size={12} className="text-white" />
                </div>
                <h2 className="text-sm font-['Newsreader'] font-bold text-white">
                  Availability
                </h2>
              </div>
              <button
                onClick={closeAvailabilityPopup}
                className="w-5 h-5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center text-white"
              >
                <X size={12} />
              </button>
            </div>
            <AvailabilityPopupContent />
          </div>
        </div>
      )}

      {/* Compact Holiday Calendar Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl animate-slideIn overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2.5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
                  <CalendarIcon size={12} className="text-white" />
                </div>
                <h2 className="text-sm font-['Newsreader'] font-bold text-white">
                  Holidays
                </h2>
              </div>
              <button
                onClick={closeHolidayModal}
                className="w-5 h-5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center text-white"
              >
                <X size={12} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="compact-calendar-wrapper">
                <Calendar
                  onChange={handleDateClick}
                  value={selectedDate}
                  tileClassName={tileClassName}
                  tileContent={tileContent}
                  minDate={new Date()}
                  formatMonthYear={(locale, date) => `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`}
                />
              </div>
              
              {holidays.length === 0 && (
                <div className="text-center mt-3 py-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl mb-1">📅</div>
                  <p className="text-slate-500 text-xs font-medium">No holidays scheduled</p>
                </div>
              )}

              <div className="mt-3 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                  <span>Yellow = Holidays</span>
                </span>
                <span className="inline-flex items-center gap-1 ml-2">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                  <span>Gray = Past</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ultra Compact Holiday Details Popup */}
      {selectedHoliday && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-lg max-w-xs w-full shadow-2xl animate-slideIn overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-sm">🎉</span>
                  <h2 className="text-xs font-semibold text-white">Holiday</h2>
                </div>
                <button onClick={closeHolidayPopup} className="text-white/80 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="p-4 text-center">
              <h3 className="text-sm font-bold text-slate-800 mb-1">{selectedHoliday.holiday_name || selectedHoliday.holidayName}</h3>
              <p className="text-amber-600 text-xs font-medium mb-2">{formatHolidayDate(selectedHoliday.holiday_date || selectedHoliday.holidayDate || '')}</p>
              {selectedHoliday.description && (
                <p className="text-xs text-slate-600 bg-amber-50 rounded-lg p-2 mb-2">{selectedHoliday.description}</p>
              )}
              <p className="text-[10px] text-slate-400">University closed this day</p>
            </div>
            <div className="border-t border-slate-100 p-2 flex justify-center">
              <button onClick={closeHolidayPopup} className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md hover:from-amber-600 hover:to-orange-600 transition-all text-xs font-semibold shadow-sm">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ultra Compact Regular Day Popup */}
      {showNoHolidayPopup && noHolidayDate && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-lg max-w-xs w-full shadow-2xl animate-slideIn overflow-hidden">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-sm">📆</span>
                  <h2 className="text-xs font-semibold text-white">Regular Day</h2>
                </div>
                <button onClick={closeNoHolidayPopup} className="text-white/80 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="p-4 text-center">
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                {noHolidayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </h3>
              <p className="text-xs text-slate-500 mb-2">No holiday scheduled</p>
              <div className="bg-emerald-50 rounded-md p-2">
                <p className="text-[11px] text-emerald-700 font-medium">✨ All resources available for booking</p>
              </div>
            </div>
            <div className="border-t border-slate-100 p-2 flex justify-center">
              <button onClick={closeNoHolidayPopup} className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-md hover:from-emerald-600 hover:to-teal-600 transition-all text-xs font-semibold shadow-sm">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

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

                {/* Hide Capacity in Details Modal for EQUIPMENT */}
                {selectedResource.type !== 'EQUIPMENT' && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                      Capacity
                    </label>
                    <p className="mt-2 text-base font-semibold text-slate-800">
                      {selectedResource.capacity}
                    </p>
                  </div>
                )}

                <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-5 ${selectedResource.type === 'EQUIPMENT' ? 'md:col-span-2' : ''}`}>
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

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.2s ease;
        }
        
        /* Ultra Compact Calendar Styles */
        .compact-calendar-wrapper {
          padding: 8px;
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }
        
        .react-calendar {
          width: 100% !important;
          border: none !important;
          font-family: inherit !important;
          background: transparent !important;
        }
        
        .react-calendar__navigation {
          margin-bottom: 8px !important;
        }
        
        .react-calendar__navigation button {
          color: #1e293b !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          padding: 2px 8px !important;
          border-radius: 6px !important;
        }
        
        .react-calendar__navigation button:hover {
          background-color: #f1f5f9 !important;
        }
        
        .react-calendar__navigation__label {
          font-weight: 700 !important;
          color: #0f172a !important;
          font-size: 11px !important;
        }
        
        .react-calendar__month-view__weekdays {
          text-transform: uppercase !important;
          font-weight: 700 !important;
          font-size: 8px !important;
          color: #94a3b8 !important;
          letter-spacing: 0.5px !important;
        }
        
        .react-calendar__month-view__weekdays__weekday {
          padding: 5px 0 !important;
        }
        
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none !important;
        }
        
        /* Past dates styling - Gray font */
        .react-calendar__tile--past {
          color: #94a3b8 !important;
          opacity: 0.7 !important;
        }
        
        .react-calendar__month-view__days__day--neighboringMonth {
          color: #cbd5e1 !important;
        }
        
        .react-calendar__tile {
          padding: 6px 2px !important;
          border-radius: 6px !important;
          transition: all 0.2s ease !important;
          font-weight: 500 !important;
          font-size: 11px !important;
          color: #334155 !important;
        }
        
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #fef3c7 !important;
          transform: translateY(-1px) !important;
        }
        
        /* Disabled dates (past dates) */
        .react-calendar__tile:disabled {
          color: #cbd5e1 !important;
          opacity: 0.5 !important;
        }
        
        .react-calendar__tile--now {
          background: #e0e7ff !important;
          color: #1e40af !important;
          font-weight: 700 !important;
        }
        
        .react-calendar__tile--active {
          background: #002147 !important;
          color: white !important;
        }
        
        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          background: #002147 !important;
        }
        
        .react-calendar__month-view__days__day--weekend {
          color: #ef4444 !important;
        }
        
        /* Holiday tile styling - Ultra Compact */
        .client-holiday-tile {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
          color: #b45309 !important;
          font-weight: 700 !important;
          position: relative !important;
          border: 1px solid #fbbf24 !important;
        }
        
        .client-holiday-tile:enabled:hover,
        .client-holiday-tile:enabled:focus {
          background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2) !important;
        }
        
        .client-holiday-tile.react-calendar__tile--active {
          background: #002147 !important;
          color: white !important;
          border: 1px solid #002147 !important;
        }
        
        /* Holiday dot indicator - Ultra Compact */
        .client-holiday-dot {
          width: 4px;
          height: 4px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-radius: 50%;
          margin: 2px auto 0;
        }
      `}</style>
    </div>
  );
};

export default ResourceCataloguePage;