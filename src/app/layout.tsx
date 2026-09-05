import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { AdminDashboardQuickAction } from "@/components/AdminDashboardQuickAction";
import { DiscountPriceEnhancer } from "@/components/DiscountPriceEnhancer";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ELYON BARBER | Reservas",
  description: "reservas online en ELYON BARBER.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${manrope.variable}`}>
      <body>{children}<DiscountPriceEnhancer /><AdminDashboardQuickAction /></body>
    </html>
  );
}
