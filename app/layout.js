import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "DEALX INDIA",
  description: "Shop at the best price",
  metadataBase: new URL("https://dealxindia.com"), // TODO: replace with your real production domain
  openGraph: {
    title: "DEALX INDIA",
    description: "Shop at the best price",
    siteName: "DEALX INDIA",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="font-sans">{children}</body>
    </html>
  );
}