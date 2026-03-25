import { Quicksand } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-igather",
});

export const metadata: Metadata = {
  title: "iGather",
  description: "Social hangout planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${quicksand.variable} ${quicksand.className} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
