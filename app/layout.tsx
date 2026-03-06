import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jubeat Songs - 曲目数据库',
  description: 'jubeat 全版本曲目数据库，支持难度筛选、搜索、版本过滤',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
