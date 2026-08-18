import nodemailer from "nodemailer";
import { getSupabaseAdmin } from "./supabaseAdmin";

type ReminderData = { firstName: string; lastName?: string | null; date: string; time: string; barberName: string };
type BibleVerse = { text: string; reference: string; translation?: string | null };

function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function customerGreeting(firstName: string, lastName?: string | null) { return [firstName.trim(), lastName?.trim() ?? ""].filter(Boolean).join(" ") || "cliente"; }
function formatDate(date: string) { const parsed = new Date(`${date}T12:00:00`); return new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Santiago" }).format(parsed).replace(/^./, (c) => c.toUpperCase()); }
function formatTime(time: string) { const [hour, minute] = time.slice(0, 5).split(":").map(Number); const suffix = hour >= 12 ? "PM" : "AM"; const displayHour = hour % 12 || 12; return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`; }

function reminderHtml(data: ReminderData, siteUrl: string, verse?: BibleVerse | null) {
  const greeting = customerGreeting(data.firstName, data.lastName);
  const barber = data.barberName.trim() || "Alonso Salinas";
  const date = formatDate(data.date);
  const time = formatTime(data.time);
  const verseBlock = verse?.text?.trim() && verse.reference?.trim() ? `<tr><td style="padding:18px 30px 20px;background:#fff;border-top:1px solid #edf2f0;text-align:center"><p style="margin:0 auto;max-width:500px;font-size:12px;line-height:1.7;font-style:italic;color:#7b8985">“${escapeHtml(verse.text.trim())}”</p><p style="margin:6px 0 0;font-size:10px;line-height:1.4;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#a0aaa7">${escapeHtml(verse.reference.trim())}${verse.translation?.trim() ? ` · ${escapeHtml(verse.translation.trim())}` : ""}</p></td></tr>` : "";
  const baseUrl = siteUrl.replace(/\/$/, "");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Recordatorio de reserva · ELYON BARBER</title><style>@media screen and (max-width:600px){.shell{padding:12px!important}.card{border-radius:18px!important}.content{padding:28px 22px!important}.title{font-size:26px!important}.verse{padding:16px 22px!important}}</style></head><body style="margin:0;padding:0;background:#eef5f3;font-family:Arial,Helvetica,sans-serif;color:#142522;-webkit-text-size-adjust:100%"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef5f3"><tr><td class="shell" align="center" style="padding:30px 16px"><table role="presentation" class="card" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#fff;border:1px solid #d7e9e5;border-radius:24px;overflow:hidden"><tr><td style="padding:28px 34px;background:#042f2e;color:#fff"><div style="font-size:12px;letter-spacing:4px;font-weight:800;color:#bfe7df">ELYON BARBER</div><h1 class="title" style="margin:16px 0 0;font-size:29px;line-height:1.15;font-weight:800">Recordatorio de tu reserva</h1></td></tr><tr><td class="content" style="padding:34px"><p style="margin:0;font-size:17px;line-height:1.65">Hola <strong>${escapeHtml(greeting)}</strong>,</p><p style="margin:10px 0 0;font-size:15px;line-height:1.7;color:#64736f">Te recordamos que tienes una reserva con el barbero <strong style="color:#142522">${escapeHtml(barber)}</strong> el día <strong style="color:#142522">${escapeHtml(date)}</strong>, a las <strong style="color:#142522">${escapeHtml(time)}</strong>.</p><p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#64736f">Te esperamos en <strong style="color:#142522">Elyon Barber.</strong></p></td></tr>${verseBlock}<tr><td style="padding:20px 34px;background:#f7faf8;border-top:1px solid #e1eeeb;text-align:center"><div style="font-size:11px;letter-spacing:2px;font-weight:800;color:#042f2e">ELYON BARBER</div><p style="margin:8px 0 0;font-size:11px;line-height:1.5;color:#7b8985">© ELYON BARBER ESTUDIO</p></td></tr></table></td></tr></table></body></html>`;
}

async function getReminderVerse(): Promise<BibleVerse | null> {
  try {
    const { data, error } = await getSupabaseAdmin().from("bible_verse_settings").select("text,reference,translation,show_email").limit(1).single();
    if (error || !data?.show_email) return null;
    return data;
  } catch (error) {
    console.error("Could not load reminder email verse:", error);
    return null;
  }
}

export async function sendReservationReminderEmail(to: string, data: ReminderData, siteUrl: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error("SMTP is not configured.");
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 465), secure: process.env.SMTP_SECURE !== "false", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  await transporter.verify();
  const verse = await getReminderVerse();
  await transporter.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject: "Recordatorio de reserva · ELYON BARBER", html: reminderHtml(data, siteUrl, verse) });
}
