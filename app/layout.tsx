import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./panel-transitions.css";

export const metadata: Metadata = {
  title: "Fındık Universe",
  description: "Fındık'ın küçük macera dünyası.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Fındık", statusBarStyle: "default" },
  icons: { apple: "/icons/icon-192.svg", icon: "/icons/icon-192.svg" },
};

export const viewport: Viewport = { themeColor: "#f7efe4", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
