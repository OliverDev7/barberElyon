import nodemailer from "nodemailer";
import { formatTime } from "./format";

type ReservationEmail = {
  firstName: string;
  lastName?: string | null;
  serviceName: string;
  date: string;
  time: string;
  barberName?: string;
};

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function customerGreeting(firstName: string, lastName?: string | null) {
  const first = firstName.trim();
  const last = lastName?.trim() ?? "";
  return [first, last].filter(Boolean).join(" ") || "cliente";
}

export function reservationEmailHtml(data: ReservationEmail, siteUrl: string) {
  const barberName = data.barberName?.trim() || "Barbero Alonso Salinas";
  const greeting = customerGreeting(data.firstName, data.lastName);
  const baseUrl = siteUrl.replace(/\/$/, "");
  const policiesUrl = `${baseUrl}/politicas-de-uso`;
  const termsUrl = `${baseUrl}/terminos-y-condiciones`;
  const details = [["Servicio", data.serviceName], ["Fecha", data.date], ["Hora", formatTime(data.time)], ["Barbero", barberName]];

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Reserva confirmada · ELYON BARBER</title>
<style>@media screen and (max-width:600px){.shell{padding:12px!important}.card{border-radius:18px!important}.hero{padding:28px 22px!important}.content{padding:26px 22px!important}.title{font-size:27px!important}.detail{display:block!important;width:100%!important;padding:10px 0!important}.legal-link{display:block!important;margin:8px 0!important}}</style></head>
<body style="margin:0;padding:0;background:#eef5f3;font-family:Arial,Helvetica,sans-serif;color:#142522;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef5f3"><tr><td class="shell" align="center" style="padding:30px 16px">
<table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#fff;border:1px solid #d7e9e5;border-radius:24px;overflow:hidden">
<tr><td class="hero" style="padding:34px;background:#042f2e;color:#fff"><div style="font-size:12px;letter-spacing:4px;font-weight:800;color:#bfe7df">ELYON BARBER</div><h1 class="title" style="margin:18px 0 0;font-size:31px;line-height:1.15;font-weight:800">Tu reserva está confirmada</h1></td></tr>
<tr><td class="content" style="padding:34px"><p style="margin:0;font-size:17px;line-height:1.65">Hola <strong>${escapeHtml(greeting)}</strong>,</p><p style="margin:8px 0 0;font-size:15px;line-height:1.7;color:#64736f">Gracias por reservar con ELYON BARBER. Aquí tienes los datos de tu cita.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;background:#f5faf8;border:1px solid #d7e9e5;border-radius:16px"><tr><td style="padding:18px 20px;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;font-weight:800;color:#64736f">Detalle de la reserva</td></tr>
${details.map(([label, value]) => `<tr><td class="detail" style="padding:10px 20px;border-top:1px solid #e1eeeb"><span style="display:inline-block;width:110px;color:#64736f;font-size:13px;font-weight:700">${label}</span><strong style="font-size:14px;color:#142522">${escapeHtml(value)}</strong></td></tr>`).join("")}
</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px"><tr><td style="padding:18px 0;border-top:1px solid #e1eeeb;border-bottom:1px solid #e1eeeb;text-align:center"><p style="margin:0 0 10px;font-size:12px;font-weight:800;color:#64736f">Para más información, visita:</p><a class="legal-link" href="${escapeHtml(policiesUrl)}" style="display:inline-block;margin:0 10px;color:#0b6962;font-size:12px;font-weight:700;text-decoration:underline">Políticas de uso</a><a class="legal-link" href="${escapeHtml(termsUrl)}" style="display:inline-block;margin:0 10px;color:#0b6962;font-size:12px;font-weight:700;text-decoration:underline">Términos y condiciones</a></td></tr></table>
</td></tr>
<tr><td style="padding:20px 34px;background:#f7faf8;border-top:1px solid #e1eeeb;text-align:center"><div style="font-size:11px;letter-spacing:2px;font-weight:800;color:#042f2e">ELYON BARBER</div><p style="margin:8px 0 0;font-size:11px;line-height:1.5;color:#7b8985">© ELYON BARBER ESTUDIO — TODOS LOS DERECHOS RESERVADOS</p></td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendReservationEmail(to: string, data: ReservationEmail, siteUrl: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error("SMTP is not configured.");
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 465), secure: process.env.SMTP_SECURE !== "false", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  await transporter.verify();
  await transporter.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject: "Reserva confirmada · ELYON BARBER", html: reservationEmailHtml(data, siteUrl) });
}
