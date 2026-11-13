import type { Metadata } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import "./globals.css";

// Dirección tipográfica "Inscripción": titulares romanos y texto sans para leer.
const titular = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--fuente-titular", display: "swap" });
const texto = Source_Sans_3({ subsets: ["latin"], variable: "--fuente-texto", display: "swap" });

export const metadata: Metadata = {
  title: "Patrimonia",
  description:
    "Una guía gratuita y de código abierto para armar una cartera de inversión a largo plazo y un plan para tu patrimonio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-UY" className={`${titular.variable} ${texto.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
