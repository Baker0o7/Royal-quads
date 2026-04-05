import { BUSINESS_NAME } from './constants';
// ── SMS / WhatsApp alert helpers (Kenya-optimised) ────────────────────────────
// WhatsApp is the dominant messaging platform in Kenya.
// We use wa.me deep links which work on all devices.

function fmt(phone: string): string {
  // Normalise to international format: 0712345678 → 254712345678
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0'))   return '254' + digits.slice(1);
  if (digits.startsWith('7') || digits.startsWith('1')) return '254' + digits;
  return digits;
}

export function sendWhatsApp(phone: string, message: string): void {
  const url = `https://wa.me/${fmt(phone)}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
}

export function sendSMS(phone: string, message: string): void {
  // sms: URI opens native SMS app
  window.location.href = `sms:${fmt(phone)}?body=${encodeURIComponent(message)}`;
}

// ── Pre-built message templates ───────────────────────────────────────────────
export const smsTemplates = {
  rideStarted: (name: string, quad: string, duration: number, receiptId: string) =>
    `Hi ${name}! 🏍️ Your ${duration}-min quad ride on *${quad}* has started at ${BUSINESS_NAME}.\n\nReceipt: ${receiptId}\nEnjoy the dunes! 🏜️\n\n📍 https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6`,

  rideComplete: (name: string, total: number, receiptId: string) =>
    `Hi ${name}! ✅ Your ride is complete.\n\nTotal paid: *${total.toLocaleString()} KES*\nReceipt: ${receiptId}\n\nThank you for riding with ${BUSINESS_NAME}! Come back soon 🏜️`,

  overtime: (name: string, mins: number, charge: number) =>
    `⏰ Hi ${name}, your quad ride time has ended ${mins} minute(s) ago.\nOvertime charge: *${charge.toLocaleString()} KES* (100 KES/min)\n\nPlease return the quad to ${BUSINESS_NAME}. Thank you!`,

  depositReminder: (name: string, amount: number) =>
    `💰 Hi ${name}, reminder that your deposit of *${amount.toLocaleString()} KES* will be returned when the quad is back at ${BUSINESS_NAME}. Thank you!`,

  prebookConfirmed: (name: string, quad: string, dateTime: string) =>
    `📅 Hi ${name}! Your quad booking at ${BUSINESS_NAME} is *CONFIRMED*.\n\n🏍️ Quad: ${quad}\n🕐 Time: ${dateTime}\n\nSee you at the dunes! 📍 https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6`,

  waitlistReady: (name: string) =>
    `🔔 Hi ${name}! A quad is now available for you at ${BUSINESS_NAME}.\n\nCome quickly before it's taken! 📍 https://maps.app.goo.gl/xrHm41wB8Gd6JKpa6`,
};
