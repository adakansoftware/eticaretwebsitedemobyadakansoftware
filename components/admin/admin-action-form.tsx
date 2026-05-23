"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionResult } from "@/lib/action-response";

type AdminActionFormProps = {
  action: (
    state: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
};

export function AdminActionForm({
  action,
  children,
  className,
  resetOnSuccess = false
}: AdminActionFormProps) {
  const [state, formAction] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success && resetOnSuccess) {
      formRef.current?.reset();
    }
  }, [resetOnSuccess, state]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
      {state ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            state.success
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-rose-400/30 bg-rose-500/10 text-rose-100"
          }`}
        >
          {state.message ?? (state.success ? "İşlem tamamlandı." : "İşlem başarısız oldu.")}
        </div>
      ) : null}
    </form>
  );
}
