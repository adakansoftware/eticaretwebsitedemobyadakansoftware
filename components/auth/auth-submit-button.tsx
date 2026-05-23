"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type AuthSubmitButtonProps = ButtonProps & {
  idleLabel: string;
  pendingLabel?: string;
};

export function AuthSubmitButton({
  idleLabel,
  pendingLabel = "Gonderiliyor...",
  ...props
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} disabled={pending || props.disabled}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
