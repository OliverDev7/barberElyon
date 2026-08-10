import nodemailer from "nodemailer";
import { formatPrice, formatTime } from "./format";

type ReservationEmail = {
  firstName: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  observations?: string | null;
};

export function reservationEmailHtml(data: ReservationEmail) {
  const observations = data.observations?.trim();
  return `
  <div style="margin:0;padding:0;background:#f7faf8;font-family:Arial,Helvetica,sans-serif;color:#132321;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7faf8;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #d9eeea;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="background:#042f2e;color:#ffffff;padding:28px;">
                <div style="font-size:13px;letter-spacing:3px;font-weight:800;">ELYON BARBER</div>
                <h1 style="margin:18px 0 0;font-size:30px;line-height:1.15;">Tu reserva esta confirmada</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="font-size:16px;line-height:1.7;margin:0 0 16px;">Hola, <strong>${data.firstName}</strong>.</p>
                <p style="font-size:16px;line-height:1.7;margin:0 0 22px;">Tu reserva fue agendada correctamente.</p>
                <div style="border:1px solid #d9eeea;border-radius:14px;padding:18px;background:#f7faf8;">
                  <p style="margin:0 0 10px;"><strong>Servicio:</strong> ${data.serviceName}</p>
                  <p style="margin:0 0 10px;"><strong>Fecha:</strong> ${data.date}</p>
                  <p style="margin:0 0 10px;"><strong>Hora:</strong> ${formatTime(data.time)}</p>
                  <p style="margin:0 0 10px;"><strong>Barbero:</strong> Barbero Alonso Salinas</p>
                  <p style="margin:0;"><strong>Precio:</strong> ${formatPrice(data.price)}</p>
                </div>
                ${observations ? `<p style="font-size:15px;line-height:1.7;margin:22px 0 0;"><strong>Observaciones:</strong> ${observations}</p>` : `<p style="font-size:15px;line-height:1.7;margin:22px 0 0;"><strong>Observaciones:</strong> Sin observaciones.</p>`}
                <p style="font-size:16px;line-height:1.7;margin:26px 0 0;">Te esperamos en <strong>ELYON BARBER</strong>.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendReservationEmail(to: string, data: ReservationEmail) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP is not configured. Skipping reservation email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject: "Tu reserva en ELYON BARBER esta confirmada",
    html: reservationEmailHtml(data),
  });
}
