export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface BookingRequestDTO {
  resourceId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  expectedAttendees: number;
}

export interface BookingResponseDTO {
  bookingId: number;
  resourceId: number;
  resourceName: string;
  resourceCode: string;
  resourceType?: string | null;
  requestedById: number;
  requestedByName: string;
  requestedByRole: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  expectedAttendees: number;
  status: BookingStatus;
  adminReason?: string | null;
  approvedOrRejectedById?: number | null;
  approvedOrRejectedByName?: string | null;
  decisionAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface BookingSlotDTO {
  startTime: string;
  endTime: string;
  status: "PENDING" | "APPROVED";
}
