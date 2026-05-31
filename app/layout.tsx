import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css"; // Ini wajib ada agar Tailwind CSS bekerja!
import Navbar from "@/components/navbar"; 

// 1. Mengambil font elegan dari Google
const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair" 
});

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter" 
});

// 2. Metadata Website (Informasi tab browser)
export const metadata: Metadata = {
  title: "SkinSight AI - Clinic",
  description: "Personalized Skincare & Treatment Analysis by Klinik Azzahrah",
};

// 3. Layout Utama
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Menggabungkan variabel font dan warna latar belakang utama */}
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-[#FDFBF7] text-[#333333]`}>
        
        {/* PASANG NAVBAR DI SINI AGAR MUNCUL DI SEMUA HALAMAN */}
        <Navbar />
        
        {/* Karena navbar kita 'fixed' (melayang di atas), kita beri padding-top (pt-20) agar konten tidak tertutup navbar */}
        <div className="pt-20">
          {children}
        </div>
        
      </body>
    </html>
  );
}