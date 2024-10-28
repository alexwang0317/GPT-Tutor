'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

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
      // Change the condition to check for the 'E' key
      if ((event.metaKey || event.ctrlKey) && event.code === 'KeyE') {
        event.preventDefault();
        setSelectionMode(prev => !prev);
        console.log('Selection mode toggled to:', !selectionMode);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionMode]);

  const onSelectionFinished = async (position, content, hideTipAndSelection) => {
    const selectedText = content.text;
    
    try {
      const response = await axios.post('/api/explain', { text: selectedText });
      setExplanation(response.data.explanation);
      hideTipAndSelection();
    } catch (error) {
      console.error('Error fetching explanation:', error);
    }
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      {/* Custom Selection Mode Indicator */}
      {selectionMode && (
        <div className="w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
          Selection Mode Active - Click and drag to select areas
        </div>
      )}
      
      <main className="flex flex-col gap-8 items-center sm:items-start w-full">
        <div className="relative w-full" style={{ height: "80vh" }}>
          <PdfLoader url={url} beforeLoad={<div>Loading PDF...</div>}>
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={selectionMode}
                onSelectionFinished={onSelectionFinished}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
        
        {explanation && (
          <div className="mt-4 p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-2">Explanation</h2>
            <p className="text-gray-700">{explanation}</p>
          </div>
        )}
      </main>

      {/* Keyboard Shortcut Reminder */}
      <div className="text-sm text-gray-500">
        Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Shift + Space to toggle selection mode
      </div>
    </div>
  );
}

export default PDFViewer;
