import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OtaBootstrap } from "../components/OtaBootstrap";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NVIDIA AI Supercomputing & Competency Centre | Sri Eshwar",
  description: "Sri Eshwar NVIDIA AI Supercomputing & Competency Centre platform for AI learning, GPU compute, and research credentials",
  icons: {
    icon: "/Eswar.png?v=2",
    shortcut: "/Eswar.png?v=2",
    apple: "/Eswar.png?v=2",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/Eswar.png?v=2" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/Eswar.png?v=2" type="image/png" />
        <link rel="apple-touch-icon" href="/Eswar.png?v=2" />
      </head>
      <body className="font-sans antialiased">
        <OtaBootstrap />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
