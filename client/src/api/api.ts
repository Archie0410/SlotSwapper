import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'BUSY' | 'SWAPPABLE' | 'SWAP_PENDING';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; email: string };
}

export interface SwapRequest {
  id: string;
  mySlotId: string;
  theirSlotId: string;
  fromUserId: string;
  toUserId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  mySlot: Event;
  theirSlot: Event;
  fromUser: { id: string; name: string; email: string };
  toUser: { id: string; name: string; email: string };
}

export const eventsApi = {
  getAll: () => axios.get<Event[]>(`${API_BASE}/events`),
  create: (data: { title: string; startTime: string; endTime: string; status?: string }) =>
    axios.post<Event>(`${API_BASE}/events`, data),
  update: (id: string, data: Partial<Event>) =>
    axios.put<Event>(`${API_BASE}/events/${id}`, data),
  delete: (id: string) => axios.delete(`${API_BASE}/events/${id}`),
};

export const swapsApi = {
  getSwappableSlots: () => axios.get<Event[]>(`${API_BASE}/swappable-slots`),
  createSwapRequest: (data: { mySlotId: string; theirSlotId: string }) =>
    axios.post<SwapRequest>(`${API_BASE}/swap-request`, data),
  respondToSwapRequest: (requestId: string, accept: boolean) =>
    axios.post<SwapRequest>(`${API_BASE}/swap-response/${requestId}`, { accept }),
  getRequests: () =>
    axios.get<{ incoming: SwapRequest[]; outgoing: SwapRequest[] }>(`${API_BASE}/requests`),
};

