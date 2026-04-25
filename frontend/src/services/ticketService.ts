import axios from "axios";
import type { AxiosResponse } from "axios";

const API = "http://localhost:8081/api/tickets";

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
    comments,
  };
}
export const createTicket = (data: FormData) => {
  const userId = localStorage.getItem("id");
  const role = localStorage.getItem("role");
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
  const userId = localStorage.getItem("id");
  const role = localStorage.getItem("role");
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
  const userId = localStorage.getItem("id");
  const role = localStorage.getItem("role");
  return axios.post(`${API}/${id}/comments`, null, {
    params: {
      commentText: text,
      userId,
      role,
    },
  });
};

export const updateComment = (commentId: number, text: string) => {
  const userId = localStorage.getItem("id");
  const role = localStorage.getItem("role");
  return axios.put(`http://localhost:8081/api/comments/${commentId}`, null, {
    params: {
      userId,
      role,
      commentText: text,
    },
  });
};

export const deleteComment = (commentId: number) => {
  const userId = localStorage.getItem("id");
  const role = localStorage.getItem("role");
  return axios.delete(`http://localhost:8081/api/comments/${commentId}`, {
    params: {
      userId,
      role,
    },
  });
};

export const getAllTickets = () => axios.get(API);

export const getAssignableStaff = () => axios.get(`${API}/staff`);

export const updateTicketStatus = (ticketId: number, status: string, reason?: string) =>
  axios.put(`${API}/${ticketId}/status`, null, {
    params: { status, reason: reason || undefined },
  });

export const addResolutionNotes = (ticketId: number, notes: string) =>
  axios.put(`${API}/${ticketId}/resolve`, null, {
    params: { notes },
  });

export const assignStaff = (ticketId: number, staffId: number) =>
  axios.put(`${API}/${ticketId}/assign`, null, {
    params: { staffId },
  });