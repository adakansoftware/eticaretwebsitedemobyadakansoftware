import { buildEmailShell, escapeHtml, sendMail } from "@/lib/mailer";
import { getOrderStatusLabel, getTrackingCarrierLabel } from "@/lib/order-labels";

type SendOrderStatusUpdateEmailParams = {
  email: string;
  customerName: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  siteName: string;
};

export async function sendOrderStatusUpdateEmail({
  email,
  customerName,
  orderNumber,
  status,
  trackingNumber,
  trackingCarrier,
  siteName
}: SendOrderStatusUpdateEmailParams) {
  const statusLabel = getOrderStatusLabel(status);
  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#0f172a;">
      Merhaba <strong>${escapeHtml(customerName)}</strong>, siparis durumun guncellendi.
    </p>
    <div style="padding:18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
      <p style="margin:0 0 8px;font-size:14px;color:#475569;">Siparis no</p>
      <p style="margin:0;font-size:22px;font-weight:700;">${escapeHtml(orderNumber)}</p>
      <p style="margin:16px 0 0;font-size:15px;color:#475569;">Yeni durum: <strong>${escapeHtml(statusLabel)}</strong></p>
      ${
        trackingNumber
          ? `<p style="margin:12px 0 0;font-size:15px;color:#475569;">Kargo: <strong>${escapeHtml(
              getTrackingCarrierLabel(trackingCarrier)
            )}</strong><br />Takip no: <strong>${escapeHtml(trackingNumber)}</strong></p>`
          : ""
      }
    </div>
  `;

  return sendMail({
    to: email,
    subject: `${siteName} siparis durumu guncellendi: ${orderNumber}`,
    html: buildEmailShell({
      title: "Siparis durumun guncellendi",
      intro: "Siparisindeki son gelismeyi asagida gorebilirsin.",
      content,
      siteName
    })
  });
}
