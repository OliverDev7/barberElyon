import nodemailer from "nodemailer";
import { formatPrice, formatTime } from "./format";

type ReservationEmail = {
  firstName: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  observations?: string | null;
  barberName?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function reservationEmailHtml(data: ReservationEmail) {
  const observations = data.observations?.trim();
  const barberName = data.barberName?.trim() || "Barbero Alonso Salinas";
  const details = [
    ["Servicio", data.serviceName],
    ["Fecha", data.date],
    ["Hora", formatTime(data.time)],
    ["Barbero", barberName],
  ];

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Reserva confirmada · ELYON BARBER</title>
<style>
@media screen and (max-width:600px){.shell{padding:12px!important}.card{border-radius:18px!important}.hero{padding:28px 22px!important}.content{padding:26px 22px!important}.title{font-size:28px!important}.detail{display:block!important;width:100%!important;padding:10px 0!important}.cta{width:100%!important}}
</style></head>
<body style="margin:0;padding:0;background:#eef5f3;font-family:Arial,Helvetica,sans-serif;color:#142522;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef5f3;"><tr><td class="shell" align="center" style="padding:30px 16px;">
<table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #d7e9e5;border-radius:24px;overflow:hidden;">
<tr><td class="hero" style="padding:34px;background:#042f2e;color:#ffffff;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td>
<div style="font-size:12px;line-height:1;letter-spacing:4px;font-weight:800;color:#bfe7df;">ELYON BARBER</div>
<h1 class="title" style="margin:18px 0 0;font-size:34px;line-height:1.15;font-weight:800;letter-spacing:-.6px;">Tu reserva está confirmada</h1>
<p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#d9eeea;">Tu próxima visita ya tiene su hora asegurada.</p>
</td></tr></table></td></tr>
<tr><td class="content" style="padding:34px;">
<p style="margin:0;font-size:17px;line-height:1.65;">Hola, <strong>${escapeHtml(data.firstName)}</strong>.</p>
<p style="margin:8px 0 0;font-size:15px;line-height:1.7;color:#64736f;">Gracias por reservar con ELYON BARBER. Aquí tienes todos los datos de tu cita.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;background:#f5faf8;border:1px solid #d7e9e5;border-radius:16px;">
<tr><td style="padding:18px 20px;"><div style="font-size:11px;letter-spacing:1.8px;text-transform:uppercase;font-weight:800;color:#64736f;">Detalle de la reserva</div></td></tr>
${details.map(([label, value]) => `<tr><td class="detail" style="padding:10px 20px;border-top:1px solid #e1eeeb;"><span style="display:inline-block;width:110px;color:#64736f;font-size:13px;font-weight:700;">${label}</span><strong style="font-size:14px;color:#142522;">${escapeHtml(value)}</strong></td></tr>`).join("")}
<tr><td style="padding:16px 20px;border-top:1px solid #d7e9e5;"><span style="color:#64736f;font-size:13px;font-weight:700;">Precio</span><div style="margin-top:4px;font-size:24px;font-weight:800;color:#042f2e;">${formatPrice(data.price)}</div></td></tr>
</table>
${observations ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;"><tr><td style="padding:16px 18px;border-left:4px solid #0b6962;background:#f7faf8;border-radius:8px;"><div style="font-size:12px;font-weight:800;color:#64736f;text-transform:uppercase;letter-spacing:1px;">Observaciones</div><p style="margin:6px 0 0;font-size:14px;line-height:1.65;">${escapeHtml(observations)}</p></td></tr></table>` : ""}
<div style="margin-top:28px;text-align:center;"><p style="margin:0;font-size:14px;line-height:1.7;color:#64736f;">Te esperamos en ELYON BARBER.</p><p style="margin:5px 0 0;font-size:13px;color:#64736f;">Llega unos minutos antes de tu hora para disfrutar tu atención con tranquilidad.</p></div>
</td></tr>
<tr><td style="padding:20px 34px;background:#f7faf8;border-top:1px solid #e1eeeb;text-align:center;"><div style="font-size:11px;letter-spacing:2px;font-weight:800;color:#042f2e;">ELYON BARBER</div><p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#7b8985;">Este correo confirma los datos de tu reserva.</p></td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendReservationEmail(to: string, data: ReservationEmail) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error("SMTP is not configured.");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.verify();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: "Reserva confirmada · ELYON BARBER",
    html: reservationEmailHtml(data),
  });
}
