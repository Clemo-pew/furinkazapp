import type { MetadataRoute } from "next";

// Permette di aggiungere l'app alla schermata Home del telefono, con nome e icona propri.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FurinkazApp",
    short_name: "FurinkazApp",
    description: "Misure fisiche e analisi del kumite per gli atleti di karate.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f2ed",
    theme_color: "#5c0a0c",
    lang: "it",
    icons: [
      { src: "/icona-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icona-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
