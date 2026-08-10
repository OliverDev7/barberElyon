export function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
}

export function formatTime(time24: string) {
  const [hours, minutes] = time24.split(":").map(Number);
  if (hours < 12) return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours === 12 ? 12 : hours - 12;
  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function durationLabel(minutes: number) {
  if (minutes === 60) return "1 hora";
  if (minutes === 90) return "1 hora 30 minutos";
  if (minutes % 60 === 0) return `${minutes / 60} horas`;
  return `${minutes} minutos`;
}
