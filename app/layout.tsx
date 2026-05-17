import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Adakan Commerce Core", description: "Reusable Turkish-first e-commerce foundation" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="tr"><body>{children}</body></html>; }
