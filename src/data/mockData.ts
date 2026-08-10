import { Client, DayStatus, Reservation, Service } from "@/types";

export const brandName = "ELYON BARBER";
export const bookingLink = "/reservar/elyon-barber";

export const services: Service[] = [
  { id: "cut", name: "Corte de cabello", price: 12000, duration: 60, icon: "Corte", active: true },
  { id: "cut-beard", name: "Corte de cabello + barba", price: 18000, duration: 90, icon: "Barba", active: true },
  { id: "bleach", name: "Decoloracion global", price: 70000, duration: 180, icon: "Color", active: true },
  { id: "highlights", name: "Visos color", price: 50000, duration: 180, icon: "Visos", active: true },
];

export const serviceDescriptions: Record<string, string> = {
  cut: "Incluye perfilado de cejas",
  "cut-beard": "Corte de cabello + arreglo de barba y perfilado de cejas",
  bleach: "Decoloracion total, incluye corte de cabello",
  highlights: "Visos o mechas, incluye corte de cabello",
};

export const barber = {
  initials: "B.A.",
  name: "Barbero Alonso Salinas",
};

export const weeklyAvailability = [
  { day: "Lunes", active: true, start: "09:00", end: "21:00" },
  { day: "Martes", active: true, start: "09:00", end: "21:00" },
  { day: "Miercoles", active: true, start: "09:00", end: "21:00" },
  { day: "Jueves", active: true, start: "09:00", end: "21:00" },
  { day: "Viernes", active: true, start: "09:00", end: "21:00" },
  { day: "Sabado", active: true, start: "09:00", end: "17:00" },
  { day: "Domingo", active: false, start: "", end: "" },
];

export const reservations: Reservation[] = [
  { id: "r1", client: "Pedro Gonzalez", email: "pedro@email.com", phone: "+56 9 8123 4567", serviceId: "cut-beard", date: "2026-08-10", time: "10:30", status: "Confirmada", comment: "Quiero mantener el largo de arriba." },
  { id: "r2", client: "Carlos Perez", email: "carlos@email.com", phone: "+56 9 7345 1122", serviceId: "cut", date: "2026-08-10", time: "09:00", status: "Confirmada" },
  { id: "r3", client: "Diego Soto", email: "diego@email.com", phone: "+56 9 6123 7788", serviceId: "beard", date: "2026-08-10", time: "15:30", status: "Pendiente", comment: "Tengo una referencia de corte." },
];

export const clients: Client[] = [
  { id: "c1", name: "Pedro Gonzalez", phone: "+56 9 8123 4567", email: "pedro@email.com", reservations: 12, lastVisit: "10 Ago" },
  { id: "c2", name: "Carlos Perez", phone: "+56 9 7345 1122", email: "carlos@email.com", reservations: 8, lastVisit: "10 Ago" },
  { id: "c3", name: "Diego Soto", phone: "+56 9 6123 7788", email: "diego@email.com", reservations: 4, lastVisit: "10 Ago" },
];

export const dayStatuses: Record<string, DayStatus> = {
  "2026-08-10": "few",
  "2026-08-11": "available",
  "2026-08-12": "full",
  "2026-08-15": "closed",
};

export const blockedDays = [{ date: "2026-08-15", reason: "Dia personal" }];
export const blockedHours = [{ date: "2026-08-15", time: "14:00", reason: "Hora personal" }];

export const timeSlots = [
  "09:00",
  "10:00",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "06:00 PM",
  "07:00 PM",
];

export const bookingSlotGroups = [
  { label: "Mañana", slots: ["09:00", "10:00"] },
  { label: "Tarde", slots: ["12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"] },
  { label: "Noche", slots: ["06:00 PM", "07:00 PM"] },
];

export const bookedSlots = ["10:00", "03:00 PM"];

export const notifications = [
  { id: "n1", title: "Nueva reserva", body: "Pedro Gonzalez reservo Corte + barba, 10 de agosto - 10:30", unread: true },
  { id: "n2", title: "Reserva cancelada", body: "Carlos Perez cancelo su reserva de las 15:00.", unread: true },
  { id: "n3", title: "Horario bloqueado", body: "15 de agosto - 14:00 marcado como personal.", unread: false },
];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
