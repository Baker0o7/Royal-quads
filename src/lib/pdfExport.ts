// ── PDF Receipt Export ────────────────────────────────────────────────────────
import type { Booking } from '../types';
import { OVERTIME_RATE } from '../types';

export async function exportReceiptPDF(booking: Booking): Promise<void> {
  // Dynamically import to keep initial bundle small
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  // Build an off-screen receipt HTML
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 360px; font-family: 'DM Sans', sans-serif;
    background: #f5f0e8; padding: 0; border-radius: 0;
  `;

  const totalPaid = booking.price + (booking.overtimeCharge || 0);
  const date = new Date(booking.startTime).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const time = new Date(booking.startTime).toLocaleTimeString('en-KE', {
    hour: '2-digit', minute: '2-digit'
  });

  const rows = [
    ['Quad',     booking.quadName],
    ['Duration', `${booking.duration} min`],
    ['Date',     date],
    ['Time',     time],
    ['Customer', booking.customerName],
    ['Phone',    booking.customerPhone],
    ...((booking.groupSize ?? 1) > 1 ? [['Group', `${booking.groupSize} riders`]] : []),
    ...(booking.promoCode ? [['Promo Code', `${booking.promoCode} ✓`]] : []),
    ...(booking.waiverSigned ? [['Waiver', 'Signed ✓']] : []),
    ...((booking.depositAmount ?? 0) > 0
      ? [['Deposit', `${(booking.depositAmount ?? 0).toLocaleString()} KES ${booking.depositReturned ? '(returned)' : '(held)'}`]]
      : []),
  ] as [string, string][];

  container.innerHTML = `
    <div style="background:#1a1612; color:white; padding:28px 24px; text-align:center;">
      <div style="font-size:11px; letter-spacing:3px; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-bottom:8px;">RECEIPT</div>
      <div style="font-size:24px; font-weight:700; letter-spacing:1px;">Royal Quads</div>
      <div style="font-size:11px; color:rgba(255,255,255,0.5); margin-top:4px; letter-spacing:2px;">MAMBRUI SAND DUNES</div>
      <div style="font-size:12px; color:#c9972a; margin-top:10px; font-family:monospace; letter-spacing:2px;">#${booking.receiptId}</div>
    </div>

    <div style="background:#f5f0e8; padding:0 20px;">
      ${rows.map(([label, value]) => `
        <div style="display:flex; justify-content:space-between; align-items:center;
          padding:10px 0; border-bottom:1px solid rgba(201,185,154,0.3);">
          <span style="font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#7a6e60; font-family:monospace;">${label}</span>
          <span style="font-size:13px; font-weight:500; color:#1a1612; text-align:right; max-width:55%;">${value}</span>
        </div>
      `).join('')}
    </div>

    ${(booking.overtimeCharge || 0) > 0 ? `
      <div style="background:rgba(239,68,68,0.08); margin:0 20px; border-radius:10px; padding:10px 14px;
        display:flex; justify-content:space-between; margin-top:12px; border:1px solid rgba(239,68,68,0.2);">
        <span style="font-size:11px; color:#ef4444; font-family:monospace;">
          ⏰ Overtime ${booking.overtimeMinutes}min × ${OVERTIME_RATE} KES
        </span>
        <span style="font-size:13px; font-weight:700; color:#ef4444; font-family:monospace;">
          +${(booking.overtimeCharge ?? 0).toLocaleString()} KES
        </span>
      </div>
    ` : ''}

    <div style="margin:16px 20px; background:#e8dfc9; border-radius:14px; padding:16px 20px;
      display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#7a6e60; font-family:monospace;">TOTAL PAID</span>
      <div style="text-align:right;">
        <div style="font-size:26px; font-weight:700; color:#c9972a;">${totalPaid.toLocaleString()} KES</div>
        ${booking.promoCode && booking.originalPrice > booking.price
          ? `<div style="font-size:10px; color:#7a6e60; text-decoration:line-through; font-family:monospace;">${booking.originalPrice.toLocaleString()} KES</div>`
          : ''}
      </div>
    </div>

    ${(booking.depositAmount ?? 0) > 0 && !booking.depositReturned ? `
      <div style="margin:0 20px 16px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.3);
        border-radius:10px; padding:10px 14px;">
        <span style="font-size:11px; color:#b45309;">
          💰 Deposit of ${(booking.depositAmount ?? 0).toLocaleString()} KES held — returned when quad is back.
        </span>
      </div>
    ` : ''}

    <div style="text-align:center; padding:20px; border-top:1px dashed rgba(201,185,154,0.3); margin:0 20px;">
      <div style="font-size:12px; color:#7a6e60; font-style:italic; margin-bottom:6px;">
        Thank you for riding with Royal Quads Mambrui!
      </div>
      <div style="font-size:10px; color:#c9972a; font-family:monospace; letter-spacing:1px;">
        📍 Mambrui Sand Dunes, Malindi
      </div>
      <div style="font-size:10px; color:#7a6e60; font-family:monospace; margin-top:4px;">
        0784 589 999 · 0784 993 996
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#f5f0e8',
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`RoyalQuads-${booking.receiptId}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
