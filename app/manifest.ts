import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TechChimps Admin",
    short_name: "TC Admin",
    description: "Private TechChimps admin app for payments, orders, customer tickets, inboxes, and live support alerts.",
    id: "/admin",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#071713",
    theme_color: "#0c2f27",
    orientation: "portrait",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/images/techchimps-logo-square-favicon.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/images/techchimps-logo-square.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "Live chats",
        short_name: "Chats",
        description: "Open customer live support.",
        url: "/admin#support",
        icons: [{ src: "/images/techchimps-logo-square-small.png", sizes: "96x96", type: "image/png" }]
      },
      {
        name: "Payments",
        short_name: "Payments",
        description: "Open the payment hub.",
        url: "/admin#payments",
        icons: [{ src: "/images/techchimps-logo-square-small.png", sizes: "96x96", type: "image/png" }]
      }
    ]
  };
}
