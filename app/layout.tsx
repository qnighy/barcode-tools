import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bar Code Tools",
  description: "QR Code Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
