import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Medora 360 - Laboratory Management System",
  description: "Modern Laboratory Information & Diagnostic Management System",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-orange-100 selection:text-orange-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

