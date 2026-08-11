import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Labs - Laboratory Management System",
  description: "Modern Laboratory Information & Management System",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-orange-100 selection:text-orange-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

