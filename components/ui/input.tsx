import * as React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn("h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none ring-slate-950/10 transition focus:ring-4", className)} {...props} />);
Input.displayName = "Input";
