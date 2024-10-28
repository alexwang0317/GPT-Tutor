'use client';

import dynamic from 'next/dynamic';

// Dynamically import PDFViewer with no SSR
const PDFViewer = dynamic(() => import('./components/PDFViewer'), {
  ssr: false,
  loading: () => <div>Loading PDF viewer...</div>
});

export default function Home() {
  return (
    <div className="container mx-auto">
      <PDFViewer />
    </div>
  );
}