import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const headlineFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Botánica Esencial OB",
  description:
    "Cosmética natural artesanal hecha con plantas, conocimiento y un laboratorio casero."
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${bodyFont.variable} ${headlineFont.variable}`}
    >
      <body className={bodyFont.className}>{children}</body>
    </html>
  );
}
