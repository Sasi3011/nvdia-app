import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { OtaBootstrap } from "../components/OtaBootstrap";
import { Providers } from "./providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NVIDIA AI Digital Passport",
  description: "NVIDIA AI Supercomputing & Competency Centre digital passport",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans antialiased">
        <OtaBootstrap />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
