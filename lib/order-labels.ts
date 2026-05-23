export function getOrderStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Onay bekliyor";
    case "WAITING_PAYMENT":
      return "Odeme bekleniyor";
    case "PAID":
      return "Odeme alindi";
    case "PREPARING":
      return "Hazirlaniyor";
    case "SHIPPED":
      return "Kargoya verildi";
    case "DELIVERED":
      return "Teslim edildi";
    case "CANCELLED":
      return "Iptal edildi";
    case "REFUNDED":
      return "Iade edildi";
    default:
      return status;
  }
}

export function getTrackingCarrierLabel(carrier?: string | null) {
  switch (carrier) {
    case "ARAS":
      return "Aras Kargo";
    case "MNG":
      return "MNG Kargo";
    case "YURTICI":
      return "Yurtici Kargo";
    case "PTT":
      return "PTT Kargo";
    case "SURAT":
      return "Surat Kargo";
    case "DIGER":
      return "Diger";
    default:
      return carrier ?? "Belirtilmedi";
  }
}
