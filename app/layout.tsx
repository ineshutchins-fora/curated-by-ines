import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Curated by Ines — Travel Planner',
  description: 'Personalized travel itineraries crafted with editorial taste and local knowledge.',
  openGraph: {
    title: 'Curated by Ines — Travel Planner',
    description: 'Your personalized journey, thoughtfully designed.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
