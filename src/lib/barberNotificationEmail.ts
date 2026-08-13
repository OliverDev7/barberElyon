import nodemailer from "nodemailer";
import { formatTime } from "./format";

export type BarberNotificationData = {
  firstName: string;
  lastName: string;
  phone: string;
  serviceName: string;
  date: string;
  time: string;
  barberName?: string;
  observations?: string | null;
};

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("es-CL", { weekday: "long", timeZone: "UTC" });
}

export function barberNotificationEmailHtml(data: BarberNotificationData) {
  const customerName = [data.firstName.trim(), data.lastName.trim()].filter(Boolean).join(" ") || "Cliente";
  const barberName = data.barberName?.trim() || "Barbero";
  const observations = data.observations?.trim();

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Nueva reserva · ELYON BARBER</title><style>@media screen and (max-width:600px){.shell{padding:12px!important}.card{border-radius:18px!important}.content{padding:20px!important}.label{display:block!important;width:auto!important;padding:10px 14px 2px!important;border-bottom:0!important}.value{display:block!important;padding:2px 14px 10px!important;border-bottom:1px solid #e1eeeb!important}}</style></head><body style="margin:0;padding:0;background:#eef5f3;font-family:Arial,Helvetica,sans-serif;color:#142522"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef5f3"><tr><td class="shell" align="center" style="padding:30px 16px"><table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#fff;border:1px solid #d7e9e5;border-radius:24px;overflow:hidden"><tr><td style="padding:30px 34px;background:#042f2e;color:#fff"><div style="font-size:12px;letter-spacing:4px;font-weight:800;color:#bfe7df">ELYON BARBER STUDIO</div><h1 style="margin:16px 0 0;font-size:30px;line-height:1.15">Nueva reserva</h1><p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#d9eeea">Se registró una nueva cita.</p></td></tr><tr><td class="content" style="padding:30px 34px"><div style="font-size:12px;letter-spacing:1.8px;text-transform:uppercase;font-weight:800;color:#64736f">Información de la reserva</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:14px;background:#f5faf8;border:1px solid #d7e9e5;border-radius:16px;overflow:hidden"><tr><td class="label" style="width:120px;padding:13px 18px;border-bottom:1px solid #e1eeeb;color:#64736f;font-size:13px;font-weight:700">Cliente</td><td class="value" style="padding:13px 18px;border-bottom:1px solid #e1eeeb;font-size:14px;font-weight:800">${escapeHtml(customerName)}</td></tr><tr><td class="label" style="width:120px;padding:13px 18px;border-bottom:1px solid #e1eeeb;color:#64736f;font-size:13px;font-weight:700">Teléfono</td><td class="value" style="padding:13px 18px;border-bottom:1px solid #e1eeeb;font-size:14px;font-weight:800">${escapeHtml(data.phone)}</td></tr><tr><td class="label" style="width:120px;padding:13px 18px;border-bottom:1px solid #e1eeeb;color:#64736f;font-size:13px;font-weight:700">Servicio</td><td class="value" style="padding:13px 18px;border-bottom:1px solid #e1eeeb;font-size:14px;font-weight:800">${escapeHtml(data.serviceName)}</td></tr><tr><td class="label" style="width:120px;padding:13px 18px;border-bottom:1px solid #e1eeeb;color:#64736f;font-size:13px;font-weight:700">Día</td><td class="value" style="padding:13px 18px;border-bottom:1px solid #e1eeeb;font-size:14px;font-weight:800;text-transform:capitalize">${escapeHtml(dayLabel(data.date))}</td></tr><tr><td class="label" style="width:120px;padding:13px 18px;border-bottom:1px solid #e1eeeb;color:#64736f;font-size:13px;font-weight:700">Fecha</td><td class="value" style="padding:13px 18px;border-bottom:1px solid #e1eeeb;font-size:14px;font-weight:800">${escapeHtml(data.date)}</td></tr><tr><td class="label" style="width:120px;padding:13px 18px;color:#64736f;font-size:13px;font-weight:700">Hora</td><td class="value" style="padding:13px 18px;font-size:14px;font-weight:800;color:#042f2e">${escapeHtml(formatTime(data.time))}</td></tr></table>${observations ? `<div style="margin-top:20px;border-left:4px solid #0b6962;background:#f7faf8;border-radius:10px;padding:15px 16px"><div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:800;color:#64736f">Observaciones del cliente</div><p style="margin:7px 0 0;font-size:14px;line-height:1.7">${escapeHtml(observations)}</p></div>` : ""}</td></tr><tr><td style="padding:20px 34px;background:#f7faf8;border-top:1px solid #e1eeeb;text-align:center"><div style="font-size:11px;letter-spacing:2px;font-weight:800;color:#042f2e">ELYON BARBER</div><p style="margin:8px 0 0;font-size:11px;color:#7b8985">Nueva reserva para ${escapeHtml(barberName)}</p></td></tr></table></td></tr></table></body></html>`;
}

export async function sendBarberNotificationEmail(to: string, data: BarberNotificationData) {
  if (!to.trim()) throw new Error("Barber notification email is not configured.");
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error("SMTP is not configured.");
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 465), secure: process.env.SMTP_SECURE !== "false", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  await transporter.verify();
  await transporter.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject: `Nueva reserva · ${[data.firstName, data.lastName].filter(Boolean).join(" ")}`, html: barberNotificationEmailHtml(data) });
}
