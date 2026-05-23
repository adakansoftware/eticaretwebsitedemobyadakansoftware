"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import type { ActionResult } from "@/lib/action-response";

type AuthActionFormProps = {
  action: (
    state: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
};

export function AuthActionForm({ action, children, className }: AuthActionFormProps) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className={className}>
      {children}
      {state ? (
        <div
          className={`mt-4 rounded-[1.2rem] border px-4 py-3 text-sm ${
            state.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-rose-200 bg-rose-50 text-rose-950"
          }`}
        >
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
