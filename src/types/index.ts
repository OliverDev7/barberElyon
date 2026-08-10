export type DayStatus = "available" | "few" | "full" | "closed";

export type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  icon: string;
  active: boolean;
};

export type Reservation = {
  id: string;
  client: string;
  email: string;
  phone: string;
  serviceId: string;
  date: string;
  time: string;
  status: "Confirmada" | "Pendiente" | "Cancelada";
  comment?: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  reservations: number;
  lastVisit: string;
};
