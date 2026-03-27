import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Brasil Atleta — Plataforma Nacional de Esporte",
  description:
    "Plataforma nacional de integração e monitoramento de atletas do esporte olímpico e paralímpico brasileiro. Scouting, analytics e mapa de talentos.",
  keywords: [
    "atletas",
    "esporte",
    "olimpíadas",
    "paralimpíadas",
    "brasil",
    "scouting",
    "monitoramento",
    "talentos",
  ],
  authors: [{ name: "Brasil Atleta" }],
  openGraph: {
    title: "Brasil Atleta — Plataforma Nacional de Esporte",
    description:
      "Integração e monitoramento de atletas olímpicos e paralímpicos em todo o Brasil.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
