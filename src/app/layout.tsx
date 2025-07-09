import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Head from "next/head";

// Initialize fonts with proper naming and configuration
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "700"], // Specify weights for better control
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400"], // Specify weights as needed
});

// Define metadata using the Metadata API
export const metadata: Metadata = {
  title: {
    default: "Naija Daily",
    template: "%s - Naija Daily",
  },
  description:
    "Naija Daily - Nigeria's most comprehensive and trusted online newspaper delivering breaking news, politics, business, entertainment, sports, and more.",
  openGraph: {
    url: "https://naijadaily.ng",
    type: "website",
    title: "Naija Daily",
    description:
      "Naija Daily - Nigeria's most comprehensive and trusted online newspaper delivering breaking news, politics, business, entertainment, sports, and more.",
    images: [
      {
        url: "https://opengraph.b-cdn.net/production/images/3d076465-6c44-44a7-bf6e-472b0835212e.png?token=lCjcgyHqUg-2NnEa5SBmrTyMbu8yHKfGzCdfaZfH6S4&height=335&width=1200&expires=33288055601",
        width: 1200,
        height: 335,
        alt: "Naija Daily Open Graph Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@naijadaily", // Replace with actual Twitter handle if available
    title: "Naija Daily",
    description:
      "Naija Daily - Nigeria's most comprehensive and trusted online newspaper delivering breaking news, politics, business, entertainment, sports, and more.",
    images:
      "https://opengraph.b-cdn.net/production/images/3d076465-6c44-44a7-bf6e-472b0835212e.png?token=lCjcgyHqUg-2NnEa5SBmrTyMbu8yHKfGzCdfaZfH6S4&height=335&width=1200&expires=33288055601",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}