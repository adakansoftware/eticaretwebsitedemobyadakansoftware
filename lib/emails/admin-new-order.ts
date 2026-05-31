import { buildEmailShell, escapeHtml, sendMail } from "@/lib/mailer";
import { formatPrice } from "@/lib/utils";

type SendAdminNewOrderEmailParams = {
  email: string;
  orderNumber: string;
  customerName: string;
  grandTotal: number;
  paymentMethod: string;
  siteName: string;
  adminOrderUrl: string;
};

export async function sendAdminNewOrderEmail({
  email,
  orderNumber,
  customerName,
  grandTotal,
  paymentMethod,
  siteName,
  adminOrderUrl
}: SendAdminNewOrderEmailParams) {
  const content = `
    <div style="padding:18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
      <p style="margin:0 0 8px;font-size:14px;color:#475569;">Yeni siparis geldi</p>
      <p style="margin:0;font-size:22px;font-weight:700;">${escapeHtml(orderNumber)}</p>
      <p style="margin:16px 0 0;font-size:15px;color:#475569;">
        Musteri: <strong>${escapeHtml(customerName)}</strong><br />
        Tutar: <strong>${escapeHtml(formatPrice(grandTotal))}</strong><br />
        Odeme: <strong>${escapeHtml(paymentMethod)}</strong>
      </p>
    </div>
    <p style="margin:24px 0 0;">
      <a href="${escapeHtml(adminOrderUrl)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;">
        Admin panelde ac
      </a>
    </p>
  `;

  return sendMail({
    to: email,
    subject: `${siteName} yeni siparis: ${orderNumber}`,
    html: buildEmailShell({
      title: "Yeni siparis bildirimi",
      intro: "Operasyon panelinde hizli aksiyon alabilmen icin yeni siparis detayini gonderiyoruz.",
      content,
      siteName
    })
  });
}
