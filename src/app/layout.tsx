import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Dirección tipográfica "Inscripción": titulares romanos y texto sans para leer.
const titular = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--fuente-titular", display: "swap" });
const texto = Source_Sans_3({ subsets: ["latin"], variable: "--fuente-texto", display: "swap" });

const descripcion = "Una guía gratuita y de código abierto para armar una cartera de inversión a largo plazo y un plan para tu patrimonio.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITIO_URL || "https://patrimonia.uy"),
  title: "Patrimonia",
  description: descripcion,
  openGraph: { title: "Patrimonia", description: descripcion, locale: "es_UY", type: "website", siteName: "Patrimonia" },
};

export const viewport: Viewport = { themeColor: "#f7f5f0" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-UY" className={`${titular.variable} ${texto.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a
          href="#contenido"
          className="sr-only rounded-[3px] bg-[var(--tinta)] px-4 py-2 text-[var(--fondo)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Saltar al contenido
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
