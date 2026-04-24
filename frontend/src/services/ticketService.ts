import axios from "axios";

const API = "http://localhost:8081/api/tickets";

export const createTicket = (data: FormData) => {
  const userId = localStorage.getItem("id");
  if (userId) {
    data.append("userId", userId);
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
  return axios.get(`${API}/${id}`);
};

export const addComment = (id: number, text: string) => {
  const userId = localStorage.getItem("id");
  return axios.post(`${API}/${id}/comments`, null, {
    params: {
      commentText: text,
      userId,
    },
  });
};