import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wonder Lab",
  description: "一些奇思，一点妙想。A bilingual journal of thoughts, perspectives and discoveries.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
