import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-ink)] text-white shadow-[0_12px_30px_rgba(47,33,20,0.18)] hover:-translate-y-0.5 hover:bg-[var(--brand-deep)]",
        outline:
          "border border-[var(--line)] bg-[rgba(255,250,243,0.82)] text-[var(--brand-ink)] backdrop-blur hover:border-[var(--brand-warm)] hover:bg-white",
        ghost: "text-[var(--brand-ink)] hover:bg-[rgba(47,33,20,0.06)]"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3",
        lg: "h-12 px-7"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
