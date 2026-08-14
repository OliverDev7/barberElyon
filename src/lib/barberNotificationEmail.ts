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
  clientNumber: string;
  observations?: string | null;
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
  const observations = data.observations?.trim();
  const date = formattedDate(data.date);
  const day = formattedDay(data.date);
  const time = formatTime(data.time);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Nueva reserva · ELYON BARBER STUDIO</title>
  <style>
    @media screen and (max-width: 600px) {
      .shell { padding: 10px !important; }
      .card { border-radius: 18px !important; }
      .hero { padding: 24px 20px !important; }
      .content { padding: 22px 18px !important; }
      .hero-title { font-size: 27px !important; }
      .intro { font-size: 14px !important; }
      .summary-cell { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .summary-left, .summary-right { display: block !important; width: 100% !important; text-align: left !important; }
      .detail-label { display: block !important; width: auto !important; padding-bottom: 4px !important; }
      .detail-value { display: block !important; padding-top: 0 !important; }
      .footer { padding: 18px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#eef5f3;font-family:Arial,Helvetica,sans-serif;color:#142522;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef5f3;">
  <tr>
    <td class="shell" align="center" style="padding:30px 16px;">
      <table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border:1px solid #d7e9e5;border-radius:24px;overflow:hidden;">
        <tr>
          <td class="hero" style="padding:32px 34px;background:#042f2e;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:4px;font-weight:800;color:#bfe7df;">ELYON BARBER STUDIO</div>
            <h1 class="hero-title" style="margin:16px 0 0;font-size:31px;line-height:1.15;font-weight:800;letter-spacing:-0.5px;">Nueva reserva</h1>
            <p class="intro" style="margin:11px 0 0;font-size:15px;line-height:1.65;color:#d9eeea;">Una nueva cita fue registrada en tu agenda.</p>
          </td>
        </tr>

        <tr>
          <td class="content" style="padding:32px 34px;">
            <p style="margin:0;font-size:17px;line-height:1.65;color:#142522;">Hola <strong>${escapeHtml(barberName)}</strong>,</p>
            <p style="margin:8px 0 0;font-size:15px;line-height:1.75;color:#64736f;">El cliente <strong style="color:#142522;">${escapeHtml(name)}</strong> ha reservado una nueva cita para el día <strong style="color:#142522;text-transform:capitalize;">${escapeHtml(day)}</strong> <strong style="color:#142522;">${escapeHtml(date)}</strong> a las <strong style="color:#042f2e;">${escapeHtml(time)} hrs</strong>.</p>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
              <tr>
                <td style="padding:16px 18px;background:#f1f8f6;border:1px solid #d7e9e5;border-radius:16px;">
                  <div style="font-size:11px;letter-spacing:1.7px;text-transform:uppercase;font-weight:800;color:#64736f;">Resumen de la cita</div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:12px;">
                    <tr>
                      <td class="summary-cell summary-left" width="50%" style="padding:8px 0;vertical-align:top;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7b8985;font-weight:800;">Servicio</div>
                        <div style="margin-top:4px;font-size:15px;font-weight:800;color:#142522;">${escapeHtml(data.serviceName)}</div>
                      </td>
                      <td class="summary-cell summary-right" width="50%" style="padding:8px 0 8px 18px;vertical-align:top;text-align:right;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7b8985;font-weight:800;">Hora</div>
                        <div style="margin-top:4px;font-size:18px;font-weight:900;color:#042f2e;">${escapeHtml(time)} hrs</div>
                      </td>
                    </tr>
                    <tr>
                      <td class="summary-cell summary-left" width="50%" style="padding:10px 0 2px;vertical-align:top;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7b8985;font-weight:800;">Fecha</div>
                        <div style="margin-top:4px;font-size:14px;font-weight:800;color:#142522;text-transform:capitalize;">${escapeHtml(date)}</div>
                      </td>
                      <td class="summary-cell summary-right" width="50%" style="padding:10px 0 2px 18px;vertical-align:top;text-align:right;">
                        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7b8985;font-weight:800;">Cliente</div>
                        <div style="margin-top:4px;font-size:14px;font-weight:800;color:#142522;">${escapeHtml(name)}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;background:#ffffff;border:1px solid #d7e9e5;border-radius:16px;overflow:hidden;">
              <tr>
                <td class="detail-label" style="width:150px;padding:15px 18px;border-bottom:1px solid #e1eeeb;color:#64736f;font-size:13px;font-weight:800;">Número de cliente</td>
                <td class="detail-value" style="padding:15px 18px;border-bottom:1px solid #e1eeeb;font-size:14px;font-weight:900;color:#042f2e;">#${escapeHtml(data.clientNumber)}</td>
              </tr>
              <tr>
                <td class="detail-label" style="width:150px;padding:15px 18px;color:#64736f;font-size:13px;font-weight:800;">Teléfono</td>
                <td class="detail-value" style="padding:15px 18px;font-size:14px;font-weight:800;color:#142522;">${escapeHtml(data.phone)}</td>
              </tr>
            </table>

            ${observations ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;"><tr><td style="padding:17px 18px;background:#f7faf8;border:1px solid #d7e9e5;border-left:4px solid #0b6962;border-radius:14px;"><div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:800;color:#64736f;">Observaciones del cliente</div><p style="margin:8px 0 0;font-size:14px;line-height:1.75;color:#142522;">${escapeHtml(observations)}</p></td></tr></table>` : ""}

            <div style="margin-top:26px;padding-top:20px;border-top:1px solid #e1eeeb;text-align:center;">
              <div style="font-size:12px;letter-spacing:2.5px;font-weight:900;color:#042f2e;">ELYON BARBER STUDIO</div>
              <p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:#7b8985;">Nueva notificación de reserva para tu agenda.</p>
            </div>
          </td>
        </tr>

        <tr>
          <td class="footer" style="padding:20px 34px;background:#f7faf8;border-top:1px solid #e1eeeb;text-align:center;">
            <p style="margin:0;font-size:11px;line-height:1.5;color:#8a9692;">Notificación interna · ELYON BARBER STUDIO</p>
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
  await transporter.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject: `Nueva reserva · ${[data.firstName, data.lastName].filter(Boolean).join(" ")}`, html: barberNotificationEmailHtml(data) });
}
