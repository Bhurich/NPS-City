import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'OG Preview — NPS City' },
  robots: 'noindex, nofollow',
};

export default function ThumbnailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
