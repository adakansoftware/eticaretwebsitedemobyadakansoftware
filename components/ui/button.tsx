import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center rounded-xl text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: { default: "bg-slate-950 text-white hover:bg-slate-800", outline: "border border-slate-200 bg-white hover:bg-slate-50", ghost: "hover:bg-slate-100" },
    size: { default: "h-11 px-5", sm: "h-9 px-3", lg: "h-12 px-7" }
  },
  defaultVariants: { variant: "default", size: "default" }
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
