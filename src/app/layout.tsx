import type { Metadata, Viewport } from "next";
// Font inclusi nel progetto (nessuna richiesta a servizi esterni)
import "@fontsource/dela-gothic-one/latin-400.css";
import "@fontsource-variable/figtree/index.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FurinkazApp", template: "%s · FurinkazApp" },
  description: "Misure fisiche e analisi del kumite per gli atleti di karate.",
  applicationName: "FurinkazApp",
  appleWebApp: { title: "FurinkazApp", capable: true, statusBarStyle: "default" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1a17" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
