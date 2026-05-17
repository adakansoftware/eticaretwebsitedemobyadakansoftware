import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatMoney } from "@/lib/money";
import { createSlug } from "@/lib/slug";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | string) {
  return formatMoney(value);
}

export function slugify(input: string) {
  return createSlug(input);
}
