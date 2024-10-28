'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Dynamically import react-pdf-highlighter components
const PdfLoader = dynamic(
  () => import('react-pdf-highlighter').then(mod => mod.PdfLoader),
  { ssr: false }
);

const PdfHighlighter = dynamic(
  () => import('react-pdf-highlighter').then(mod => mod.PdfHighlighter),
  { ssr: false }
);

function PDFViewer() {
  const [highlights, setHighlights] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isClient, setIsClient] = useState(false);
  const url = '/sample.pdf';

  useEffect(() => {
    setIsClient(true);
    
    function handleKeyDown(event) {
      console.log(`Key pressed: ${event.code}, Meta: ${event.metaKey}, Ctrl: ${event.ctrlKey}, Shift: ${event.shiftKey}`);
      // Check for Command/Control + Shift + E
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyE') {
        event.preventDefault();
        console.log('Selection mode activated'); // Debugging line
        setSelectionMode((prevMode) => !prevMode); // Toggle selection mode
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onSelectionFinished = async (position, content, hideTipAndSelection) => {
    const selectedText = content.text;
    hideTipAndSelection();
    setSelectionMode(false); // Turn off selection mode after use

    try {
      const response = await axios.post('/api/explain', { text: selectedText });
      setExplanation(response.data.explanation);
    } catch (error) {
      console.error('Error fetching explanation:', error);
    }
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full">
        <div className="relative w-full" style={{ height: "80vh" }}>
          <PdfLoader url={url} beforeLoad={<div>Loading PDF...</div>}>
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={() => selectionMode} // This relies on selectionMode
                onSelectionFinished={onSelectionFinished}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
        
        {explanation && (
          <div className="explanation mt-4 p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-2">Explanation</h2>
            <p className="text-gray-700">{explanation}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PDFViewer;