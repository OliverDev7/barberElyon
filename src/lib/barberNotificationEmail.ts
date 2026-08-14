import nodemailer from "nodemailer";
import { formatTime } from "./format";

export type BarberNotificationData = {
  firstName: string;
  lastName: string;
  phone: string;
  serviceName: string;
  date: string;
  time: string;
  observations?: string | null;
  barberName?: string;
};

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function customerName(data: BarberNotificationData) {
  return [data.firstName.trim(), data.lastName.trim()].filter(Boolean).join(" ") || "Cliente";
}

function formattedDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formattedDay(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("es-CL", {
    weekday: "long",
    timeZone: "UTC",
  });
}

export function barberNotificationEmailHtml(data: BarberNotificationData) {
  const name = customerName(data);
  const barberName = data.barberName?.trim() || "Elyon Barber";
  const date = formattedDate(data.date);
  const day = formattedDay(data.date);
  const time = formatTime(data.time);
  const observations = data.observations?.trim();

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Nueva reserva</title>
  <style>
    @media screen and (max-width: 600px) {
      .shell { padding: 10px !important; }
      .card { border-radius: 18px !important; }
      .hero { padding: 24px 20px !important; }
      .content { padding: 24px 20px !important; }
      .footer { padding: 20px !important; }
      .hero-title { font-size: 26px !important; }
      .intro { font-size: 14px !important; }
      .line { font-size: 15px !important; line-height: 1.8 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#eef5f3;font-family:Arial,Helvetica,sans-serif;color:#142522;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef5f3;">
  <tr>
    <td class="shell" align="center" style="padding:30px 16px;">
      <table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #d7e9e5;border-radius:24px;overflow:hidden;">
        <tr>
          <td class="hero" style="padding:30px 34px;background:#042f2e;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:4px;font-weight:800;color:#bfe7df;">ELYON BARBER STUDIO</div>
            <h1 class="hero-title" style="margin:14px 0 0;font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-0.5px;">Nueva reserva</h1>
            <p class="intro" style="margin:9px 0 0;font-size:14px;line-height:1.6;color:#d9eeea;">Se registró una nueva cita en tu agenda.</p>
          </td>
        </tr>
        <tr>
          <td class="content" style="padding:32px 34px;">
            <p class="line" style="margin:0;font-size:17px;line-height:1.65;color:#142522;">Hola <strong>${escapeHtml(barberName)}</strong>,</p>
            <p class="line" style="margin:12px 0 0;font-size:15px;line-height:1.8;color:#53635f;">El cliente <strong style="color:#142522;">${escapeHtml(name)}</strong> ha reservado una nueva cita para el día <strong style="color:#142522;text-transform:capitalize;">${escapeHtml(day)}</strong> <strong style="color:#142522;">${escapeHtml(date)}</strong> a las <strong style="color:#042f2e;">${escapeHtml(time)} hrs</strong>.</p>
            <p class="line" style="margin:12px 0 0;font-size:15px;line-height:1.8;color:#53635f;">El servicio agendado es <strong style="color:#142522;">${escapeHtml(data.serviceName)}</strong> y su número de teléfono es <strong style="color:#042f2e;">${escapeHtml(data.phone)}</strong>.</p>
            ${observations ? `<div style="margin-top:24px;padding:18px 20px;border:1px solid #d7e9e5;border-radius:14px;background:#f7fbfa;"><div style="font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#042f2e;margin-bottom:8px;">Observaciones</div><div class="line" style="font-size:15px;line-height:1.7;color:#53635f;">${escapeHtml(observations)}</div></div>` : ""}
          </td>
        </tr>
        <tr>
          <td class="footer" style="padding:22px 34px;background:#f7fbfa;border-top:1px solid #d7e9e5;text-align:center;">
            <div style="font-size:13px;font-weight:800;letter-spacing:2px;color:#042f2e;">ELYON BARBER STUDIO</div>
            <div style="margin-top:7px;font-size:12px;line-height:1.5;color:#71817d;">Nueva notificación de reserva para tu agenda.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function sendBarberNotificationEmail(to: string, data: BarberNotificationData) {
  if (!to.trim()) throw new Error("Barber notification email is not configured.");
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error("SMTP is not configured.");
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 465), secure: process.env.SMTP_SECURE !== "false", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  await transporter.verify();
  await transporter.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject: "Nueva reserva", html: barberNotificationEmailHtml(data) });
}
