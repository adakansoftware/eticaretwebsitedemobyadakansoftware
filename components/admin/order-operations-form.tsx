"use client";

import { useState } from "react";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import type { ActionResult } from "@/lib/action-response";

const orderStatuses = [
  "PENDING",
  "WAITING_PAYMENT",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED"
] as const;

const paymentStatuses = ["WAITING", "CONFIRMED", "REJECTED", "REFUNDED"] as const;

type OrderOperationsFormProps = {
  orderId: string;
  status: (typeof orderStatuses)[number];
  paymentStatus: (typeof paymentStatuses)[number];
  adminNote: string;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  action: (
    state: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
};

export function OrderOperationsForm({
  orderId,
  status,
  paymentStatus,
  adminNote,
  trackingNumber,
  trackingCarrier,
  action
}: OrderOperationsFormProps) {
  const [selectedStatus, setSelectedStatus] = useState(status);

  return (
    <AdminActionForm action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="orderId" value={orderId} />

      <select
        name="status"
        value={selectedStatus}
        onChange={(event) => setSelectedStatus(event.target.value as (typeof orderStatuses)[number])}
        className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
      >
        {orderStatuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        name="paymentStatus"
        defaultValue={paymentStatus}
        className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
      >
        {paymentStatuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {selectedStatus === "SHIPPED" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="trackingNumber"
            defaultValue={trackingNumber ?? ""}
            placeholder="Kargo takip numarasi"
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none"
          />
          <select
            name="trackingCarrier"
            defaultValue={trackingCarrier ?? ""}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white"
          >
            <option value="">Kargo firmasi sec</option>
            <option value="ARAS">Aras</option>
            <option value="MNG">MNG</option>
            <option value="YURTICI">Yurtici</option>
            <option value="PTT">PTT</option>
            <option value="SURAT">Surat</option>
            <option value="DIGER">Diger</option>
          </select>
        </div>
      ) : null}

      <textarea
        name="adminNote"
        defaultValue={adminNote}
        placeholder="Operasyon notu"
        className="min-h-32 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-white/10 transition focus:ring-4"
      />

      <AdminSubmitButton idleLabel="Degisiklikleri kaydet" pendingLabel="Kaydediliyor..." />
    </AdminActionForm>
  );
}
