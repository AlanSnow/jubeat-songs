import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jubeat 曲目查询 - jubeat Ave.',
  description: 'jubeat Ave. 曲目查询系统，支持难度筛选、搜索、诈称标记',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
