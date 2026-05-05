import type { Metadata } from "next";
import "./globals.css";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { QueryProvider } from "@/providers/QueryProvider";
import { GlobalUploadStatus } from "@/components/features/GlobalUploadStatus/GlobalUploadStatus";

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
        <ErrorBoundary>
          <QueryProvider>
            <NotificationProvider>
              {children}
              {/* Global Upload Status - Shows ALL active uploads to ALL admins */}
              <GlobalUploadStatus />
            </NotificationProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
