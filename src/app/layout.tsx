import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patrimonia",
  description: "Una guía gratuita y abierta para armar una cartera de inversión a largo plazo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-UY" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
