import "./globals.css";
import { Providers } from "./providers";
import DatabaseStatusOverlay from "@/components/DatabaseStatusOverlay";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "Hostel & Housing Hub",
  description: "Secure off-campus housing for students.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <DatabaseStatusOverlay />
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}
