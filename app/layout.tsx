// src/app/layout.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "確約管理 | Kakuyaku Manager",
  description: "MongoDB + Prisma + Next.js による確約管理システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0, background: "#0d0d0d" }}>
        {children}
      </body>
    </html>
  );
}
