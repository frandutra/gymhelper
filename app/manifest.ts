import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GymHelper",
    short_name: "GymHelper",
    description: "Administrá tus rutinas y registrá tus entrenamientos.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0d0f",
    theme_color: "#ff5a1f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
