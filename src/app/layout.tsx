import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Riva Data Admin",
  description: "Admin panel for Riva Data course management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className="antialiased bg-gray-50 min-h-screen"
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
