"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type AdminSubmitButtonProps = ButtonProps & {
  idleLabel: string;
  pendingLabel?: string;
};

export function AdminSubmitButton({
  idleLabel,
  pendingLabel = "Kaydediliyor...",
  ...props
}: AdminSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} disabled={pending || props.disabled}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
