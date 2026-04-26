import axios from "axios";
import type {
  BookingApiResponse,
  BookingRequestDTO,
  BookingResponseDTO,
  BookingSlotDTO,
} from "../types/booking";

const API_BASE_URL = "http://localhost:8081/api/bookings";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getStoredUserId = (): string => {
  const directId = localStorage.getItem("id");
  if (directId) return directId;

  const studentId = localStorage.getItem("studentId");
  if (studentId) return studentId;

  const rawUser = localStorage.getItem("user");
  if (!rawUser) return "";

  try {
    const parsed = JSON.parse(rawUser);
    if (parsed?.id) return String(parsed.id);
    if (parsed?.studentId) return String(parsed.studentId);
    if (parsed?.student_id) return String(parsed.student_id);
    return "";
  } catch {
    return "";
  }
};

interface BookingResponseApiModel {
  bookingId?: number;
  booking_id?: number;
  resourceId?: number;
  resource_id?: number;
  resourceName?: string;
  resource_name?: string;
  resourceCode?: string;
  resource_code?: string;
  resourceType?: string | null;
  resource_type?: string | null;
  requestedById?: number;
  requested_by_id?: number;
  requestedByName?: string;
  requested_by_name?: string;
  requestedByRole?: string;
  requested_by_role?: string;
  requestedByEmail?: string | null;
  requested_by_email?: string | null;
  requestedByProfileImageUrl?: string | null;
  requested_by_profile_image_url?: string | null;
  bookingDate?: string;
  booking_date?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  purpose?: string;
  expectedAttendees?: number;
  expected_attendees?: number;
  status?: BookingResponseDTO["status"];
  adminReason?: string | null;
  admin_reason?: string | null;
  approvedOrRejectedById?: number | null;
  approved_or_rejected_by_id?: number | null;
  approvedOrRejectedByName?: string | null;
  approved_or_rejected_by_name?: string | null;
  decisionAt?: string | null;
  decision_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface BookingSlotApiModel {
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  status?: BookingSlotDTO["status"];
}

const normalizeBooking = (raw: BookingResponseApiModel): BookingResponseDTO => ({
  bookingId: raw.bookingId ?? raw.booking_id ?? 0,
  resourceId: raw.resourceId ?? raw.resource_id ?? 0,
  resourceName: raw.resourceName ?? raw.resource_name ?? "",
  resourceCode: raw.resourceCode ?? raw.resource_code ?? "",
  resourceType: raw.resourceType ?? raw.resource_type ?? null,
  requestedById: raw.requestedById ?? raw.requested_by_id ?? 0,
  requestedByName: raw.requestedByName ?? raw.requested_by_name ?? "",
  requestedByRole: raw.requestedByRole ?? raw.requested_by_role ?? "",
  requestedByEmail: raw.requestedByEmail ?? raw.requested_by_email ?? null,
  requestedByProfileImageUrl: raw.requestedByProfileImageUrl ?? raw.requested_by_profile_image_url ?? null,
  bookingDate: raw.bookingDate ?? raw.booking_date ?? "",
  startTime: raw.startTime ?? raw.start_time ?? "",
  endTime: raw.endTime ?? raw.end_time ?? "",
  purpose: raw.purpose ?? "",
  expectedAttendees: raw.expectedAttendees ?? raw.expected_attendees ?? 0,
  status: (raw.status ?? "PENDING") as BookingResponseDTO["status"],
  adminReason: raw.adminReason ?? raw.admin_reason ?? null,
  approvedOrRejectedById: raw.approvedOrRejectedById ?? raw.approved_or_rejected_by_id ?? null,
  approvedOrRejectedByName: raw.approvedOrRejectedByName ?? raw.approved_or_rejected_by_name ?? null,
  decisionAt: raw.decisionAt ?? raw.decision_at ?? null,
  createdAt: raw.createdAt ?? raw.created_at ?? "",
  updatedAt: raw.updatedAt ?? raw.updated_at ?? "",
});

const toCreateBookingApiPayload = (payload: BookingRequestDTO) => ({
  resource_id: payload.resourceId,
  booking_date: payload.bookingDate,
  start_time: payload.startTime,
  end_time: payload.endTime,
  purpose: payload.purpose,
  expected_attendees: payload.expectedAttendees,
});

const normalizeTime = (timeValue?: string): string => {
  if (!timeValue) return "00:00";
  return String(timeValue).slice(0, 5);
};

const normalizeBookingSlot = (raw: BookingSlotApiModel): BookingSlotDTO => ({
  startTime: normalizeTime(raw.startTime ?? raw.start_time),
  endTime: normalizeTime(raw.endTime ?? raw.end_time),
  status: (raw.status ?? "PENDING") as BookingSlotDTO["status"],
});

const buildAuthHeaders = () => {
  const userId = getStoredUserId();
  const role = localStorage.getItem("role") || "";

  return {
    "X-User-Id": userId,
    "X-User-Role": role,
  };
};

export const bookingService = {
  async createBooking(payload: BookingRequestDTO): Promise<BookingResponseDTO> {
    const response = await api.post<BookingApiResponse<BookingResponseApiModel>>(
      "",
      toCreateBookingApiPayload(payload),
      {
        headers: buildAuthHeaders(),
      }
    );

    return normalizeBooking(response.data.data || {});
  },

  async getMyBookings(): Promise<BookingResponseDTO[]> {
    const response = await api.get<BookingApiResponse<BookingResponseApiModel[]>>("/my", {
      headers: buildAuthHeaders(),
    });

    return (response.data.data || []).map(normalizeBooking);
  },

  async getAllBookings(): Promise<BookingResponseDTO[]> {
    const response = await api.get<BookingApiResponse<BookingResponseApiModel[]>>("", {
      headers: buildAuthHeaders(),
    });

    return (response.data.data || []).map(normalizeBooking);
  },

  async approveBooking(bookingId: number): Promise<BookingResponseDTO> {
    const response = await api.put<BookingApiResponse<BookingResponseApiModel>>(
      `/${bookingId}/approve`,
      {},
      {
        headers: buildAuthHeaders(),
      }
    );

    return normalizeBooking(response.data.data || {});
  },

  async rejectBooking(bookingId: number, reason: string): Promise<BookingResponseDTO> {
    const response = await api.put<BookingApiResponse<BookingResponseApiModel>>(
      `/${bookingId}/reject`,
      {},
      {
        params: { reason },
        headers: buildAuthHeaders(),
      }
    );

    return normalizeBooking(response.data.data || {});
  },

  async cancelBooking(bookingId: number): Promise<BookingResponseDTO> {
    const response = await api.put<BookingApiResponse<BookingResponseApiModel>>(
      `/${bookingId}/cancel`,
      {},
      {
        headers: buildAuthHeaders(),
      }
    );

    return normalizeBooking(response.data.data || {});
  },

  async deleteBooking(bookingId: number): Promise<BookingResponseDTO> {
    const response = await api.delete<BookingApiResponse<BookingResponseApiModel>>(
      `/${bookingId}`,
      {
        headers: buildAuthHeaders(),
      }
    );

    return normalizeBooking(response.data.data || {});
  },

  async getBookedSlots(resourceId: number, date: string): Promise<BookingSlotDTO[]> {
    const response = await api.get<BookingApiResponse<BookingSlotApiModel[]>>(
      `/resource/${resourceId}/slots`,
      {
        params: { date },
        headers: buildAuthHeaders(),
      }
    );

    return (response.data.data || []).map(normalizeBookingSlot);
  },
};
