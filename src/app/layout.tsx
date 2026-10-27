import type { Metadata, Viewport } from "next";
// Font inclusi nel progetto (nessuna richiesta a servizi esterni)
import "@fontsource/dela-gothic-one/latin-400.css";
import "@fontsource-variable/figtree/index.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Registro Dojo", template: "%s · Registro Dojo" },
  description: "Misure fisiche e analisi del kumite per gli atleti di karate.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
