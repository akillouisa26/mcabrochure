import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Placement Brochure',
  description: 'Placement Brochure Data Collection',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="nav-bar">
          <Link href="/">Submit Form</Link>
          <Link href="/admin">Admin Panel</Link>
          <Link href="/brochure">Brochures View</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
