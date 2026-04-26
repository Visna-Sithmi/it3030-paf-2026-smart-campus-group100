import axios from "axios";
import type { AxiosResponse } from "axios";
import { getAuthItem } from "./authSession";


const API = "http://localhost:8081/api/tickets";
const MANAGER_API = "http://localhost:8081/api/manager";

function getAuthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-User-Role": "ISSUE_MANAGER"
  };
}

/** Merges snake_case into camelCase for ticket + comments (defensive; global API may be SNAKE_CASE). */
function pick<T extends Record<string, unknown>>(o: T, camel: string, snake: string): unknown {
  const v = o[camel] ?? o[snake];
  return v;
}

function normalizeComment(raw: unknown): unknown {
  if (raw == null || typeof raw !== "object") return raw;
  const c = raw as Record<string, unknown>;
  return {
    ...c,
    id: pick(c, "id", "id") ?? c.id,
    ticketId: pick(c, "ticketId", "ticket_id"),
    userId: pick(c, "userId", "user_id"),
    userName: pick(c, "userName", "user_name") ?? c.userName,
    userRole: pick(c, "userRole", "user_role") ?? c.userRole,
    commentText: pick(c, "commentText", "comment_text") ?? c.commentText,
    createdAt: pick(c, "createdAt", "created_at") ?? c.createdAt,
  };
}

export function normalizeTicketResponse(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const t = raw as Record<string, unknown>;
  const rawComments = t.comments;
  const comments = Array.isArray(rawComments) ? rawComments.map(normalizeComment) : rawComments;
  return {
    ...t,
    id: t.id,
    resourceId: pick(t, "resourceId", "resource_id") ?? t.resourceId,
    resourceName: pick(t, "resourceName", "resource_name") ?? t.resourceName,
    createdByName: pick(t, "createdByName", "created_by_name") ?? t.createdByName,
    assignedToId: pick(t, "assignedToId", "assigned_to_id") ?? t.assignedToId,
    assignedToName: pick(t, "assignedToName", "assigned_to_name") ?? t.assignedToName,
    assignedToRole: pick(t, "assignedToRole", "assigned_to_role") ?? t.assignedToRole,
    category: t.category,
    description: t.description,
    priority: t.priority,
    status: t.status,
    rejectionReason: pick(t, "rejectionReason", "rejection_reason") ?? t.rejectionReason,
    resolutionNotes: pick(t, "resolutionNotes", "resolution_notes") ?? t.resolutionNotes,
    attachmentUrls: pick(t, "attachmentUrls", "attachment_urls") ?? t.attachmentUrls,
    preferredContact: pick(t, "preferredContact", "preferred_contact") ?? t.preferredContact,
    createdAt: pick(t, "createdAt", "created_at") ?? t.createdAt,
    assignedAt: pick(t, "assignedAt", "assigned_at") ?? t.assignedAt,
    resolvedAt: pick(t, "resolvedAt", "resolved_at") ?? t.resolvedAt,
    completedAt: pick(t, "completedAt", "completed_at") ?? t.completedAt,
    closedAt: pick(t, "closedAt", "closed_at") ?? t.closedAt,
    resolvedBy: pick(t, "resolvedBy", "resolved_by") ?? t.resolvedBy,
    responseBreached: pick(t, "responseBreached", "response_breached") ?? t.responseBreached,
    resolutionBreached: pick(t, "resolutionBreached", "resolution_breached") ?? t.resolutionBreached,
    comments,
  };
}
export const createTicket = (data: FormData) => {
  const userId = getAuthItem("id");
  const role = getAuthItem("role");
  if (userId) {
    data.append("userId", userId);
  }
  if (role) {
    data.append("role", role);
  }
  return axios.post(API, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getMyTickets = () => {
  const userId = getAuthItem("id");
  const role = getAuthItem("role");
  return axios.get(`${API}/my`, {
    params: {
      userId,
      role,
    },
  });
};

export const getTicketById = (id: number) => {
  return axios
    .get<Record<string, unknown>>(`${API}/${id}`)
    .then((res: AxiosResponse<Record<string, unknown>>) => {
      const merged = normalizeTicketResponse(res.data);
      return { ...res, data: merged ?? res.data } as typeof res;
    });
};

export const addComment = (id: number, text: string) => {
  const userId = getAuthItem("id");
  const role = getAuthItem("role");
  return axios.post(`${API}/${id}/comments`, null, {
    params: {
      commentText: text,
      userId,
      role,
    },
  });
};

export const updateComment = (commentId: number, text: string) => {
  const userId = getAuthItem("id");
  const role = getAuthItem("role");
  return axios.put(`http://localhost:8081/api/comments/${commentId}`, null, {
    params: {
      userId,
      role,
      commentText: text,
    },
  });
};

export const deleteComment = (commentId: number) => {
  const userId = getAuthItem("id");
  const role = getAuthItem("role");
  return axios.delete(`http://localhost:8081/api/comments/${commentId}`, {
    params: {
      userId,
      role,
    },
  });
};

export const getAllTickets = () => axios.get(API);

export const getAssignableStaff = () => axios.get(`${API}/staff`);

export const updateTicketStatus = (ticketId: number, status: string, rejectReason?: string) => {
  const userIdRaw = getAuthItem("id");
  const roleRaw = getAuthItem("role");
  const userId = userIdRaw ? Number(userIdRaw) : null;
  const role = String(roleRaw || "").toUpperCase();
  const roleToSend = status === "REJECTED" && role === "ISSUE_MANAGER" ? "ADMIN" : roleRaw;

  return axios.put(`${API}/${ticketId}/status`, {
    status,
    userId,
    role: roleToSend,
    ...(status === "REJECTED" ? { rejectReason: rejectReason || "" } : {}),
  });
};

export const addResolutionNotes = (ticketId: number, notes: string) =>
  axios.put(`${API}/${ticketId}/resolve`, null, {
    params: { notes },
  });

export const assignStaff = (ticketId: number, staffId: number) =>
  axios.put(`${API}/${ticketId}/assign`, null, {
    params: { staffId },
  });

export const completeTicket = (ticketId: number) => {
  const userId = localStorage.getItem("id");
  const role = localStorage.getItem("role");
  return axios.patch(`${API}/${ticketId}/complete`, null, {
    params: {
      userId,
      role,
    },
    headers: {
      ...getAuthHeaders(),
    },
  });
};

export const closeTicket = (ticketId: number) => {
  const userId = localStorage.getItem("id");
  const role = localStorage.getItem("role");
  return axios.patch(`${API}/${ticketId}/close`, null, {
    params: {
      userId,
      role,
    },
    headers: {
      ...getAuthHeaders(),
    },
  });
};

export type TicketReportFilters = {
  fromDate?: string;
  toDate?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
};

function parseFilenameFromContentDisposition(headerValue: string | undefined): string | null {
  if (!headerValue) return null;
  const match = /filename="([^"]+)"/i.exec(headerValue);
  return match?.[1] || null;
}

export async function downloadTicketReport(filters: TicketReportFilters) {
  const role = (getAuthItem("role") || "").toUpperCase();

  const params: Record<string, string> = {};
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  if (filters.status && filters.status !== "ALL") params.status = filters.status;
  if (filters.priority && filters.priority !== "ALL") params.priority = filters.priority;
  if (filters.assignedTo && filters.assignedTo !== "ALL") params.assignedTo = filters.assignedTo;
  if (filters.search && filters.search.trim()) params.search = filters.search.trim();

  const res = await axios.get(`${API}/report`, {
    params,
    responseType: "blob",
    headers: {
      "X-User-Role": role,
    },
  });

  const filename =
    parseFilenameFromContentDisposition(String(res.headers?.["content-disposition"] || "")) ||
    `ticket-report-${new Date().toISOString().slice(0, 10)}.pdf`;

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export type TopTechnician = {
  name: string;
  count: number;
};

export interface ManagerAnalytics {
  totalTickets: number;
  activeTickets: number;
  avgResolutionTime: number;
  slaBreachPercentage: number;
  categoryStats: Record<string, number>;
  ticketsPerDay: Record<string, number>;
  topTechnicians: Array<{ name: string; count: number }>;
}

export const getManagerAnalytics = async () => {
  const res = await axios.get("http://localhost:8081/api/manager/analytics", {
    headers: {
      "X-User-Role": "ISSUE_MANAGER",
    },
  });

  const d = res.data;

  // 🔥 FIX: snake_case → camelCase
  return {
    data: {
      totalTickets: d.total_tickets,
      activeTickets: d.active_tickets,
      avgResolutionTime: d.avg_resolution_time,
      slaBreachPercentage: d.sla_breach_percentage,
      categoryStats: d.category_stats,
      ticketsPerDay: d.tickets_per_day,
      topTechnicians: d.top_technicians,
    },
  };
};
