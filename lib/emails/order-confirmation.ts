import { buildEmailShell, escapeHtml, sendMail } from "@/lib/mailer";
import { formatPrice } from "@/lib/utils";

type OrderConfirmationItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type SendOrderConfirmationEmailParams = {
  email: string;
  customerName: string;
  orderNumber: string;
  items: OrderConfirmationItem[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  shippingFullName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingAddress: string;
  paymentMethod: string;
  bankAccountInfo?: string | null;
  siteName: string;
};

export async function sendOrderConfirmationEmail({
  email,
  customerName,
  orderNumber,
  items,
  subtotal,
  discountTotal,
  shippingTotal,
  grandTotal,
  shippingFullName,
  shippingPhone,
  shippingCity,
  shippingDistrict,
  shippingAddress,
  paymentMethod,
  bankAccountInfo,
  siteName
}: SendOrderConfirmationEmailParams) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.name)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(formatPrice(item.unitPrice))}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(formatPrice(item.lineTotal))}</td>
        </tr>
      `
    )
    .join("");

  const content = `
    <p style="margin:0 0 20px;font-size:15px;color:#0f172a;">
      Merhaba <strong>${escapeHtml(customerName)}</strong>, siparisin alindi.
    </p>
    <div style="padding:18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
      <p style="margin:0 0 10px;font-size:14px;color:#475569;">Siparis no</p>
      <p style="margin:0;font-size:22px;font-weight:700;">${escapeHtml(orderNumber)}</p>
    </div>
    <table style="width:100%;margin-top:24px;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="text-align:left;color:#475569;">
          <th style="padding:0 0 10px;">Urun</th>
          <th style="padding:0 0 10px;text-align:center;">Adet</th>
          <th style="padding:0 0 10px;text-align:right;">Birim</th>
          <th style="padding:0 0 10px;text-align:right;">Toplam</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:24px;padding:18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Ara toplam</span><strong>${escapeHtml(formatPrice(subtotal))}</strong></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Indirim</span><strong>-${escapeHtml(formatPrice(discountTotal))}</strong></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Kargo</span><strong>${escapeHtml(formatPrice(shippingTotal))}</strong></div>
      <div style="display:flex;justify-content:space-between;font-size:18px;"><span>Genel toplam</span><strong>${escapeHtml(formatPrice(grandTotal))}</strong></div>
    </div>
    <div style="margin-top:24px;padding:18px;border-radius:18px;background:#ffffff;border:1px solid #e2e8f0;">
      <p style="margin:0 0 8px;font-weight:700;">Teslimat bilgisi</p>
      <p style="margin:0;line-height:1.7;color:#475569;">
        ${escapeHtml(shippingFullName)}<br />
        ${escapeHtml(shippingPhone)}<br />
        ${escapeHtml(`${shippingCity} / ${shippingDistrict}`)}<br />
        ${escapeHtml(shippingAddress).replaceAll("\n", "<br />")}
      </p>
    </div>
    <div style="margin-top:24px;padding:18px;border-radius:18px;background:#ffffff;border:1px solid #e2e8f0;">
      <p style="margin:0 0 8px;font-weight:700;">Odeme yontemi</p>
      <p style="margin:0;color:#475569;">${escapeHtml(paymentMethod)}</p>
      ${
        paymentMethod === "BANK_TRANSFER" && bankAccountInfo
          ? `<p style="margin:16px 0 0;white-space:pre-line;color:#475569;">${escapeHtml(bankAccountInfo)}</p>`
          : ""
      }
    </div>
  `;

  return sendMail({
    to: email,
    subject: `${siteName} siparis onayi: ${orderNumber}`,
    html: buildEmailShell({
      title: "Siparisin alindi",
      intro: "Siparis ozetin ve teslimat detaylarin asagida yer aliyor.",
      content,
      siteName
    })
  });
}
