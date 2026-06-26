import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "University Notes",
  description: "Lesson notes vault",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
