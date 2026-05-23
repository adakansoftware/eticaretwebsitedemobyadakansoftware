"use client";

import type { MouseEvent } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ButtonProps & {
  confirmMessage: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  }

  return <Button {...props} onClick={handleClick} />;
}
