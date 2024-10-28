'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Dynamically import PDF components with loading fallback
const PdfLoader = dynamic(
  () => import('react-pdf-highlighter').then(mod => mod.PdfLoader),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center">Loading PDF components...</div>
  }
);

const PdfHighlighter = dynamic(
  () => import('react-pdf-highlighter').then(mod => mod.PdfHighlighter),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center">Loading highlighter...</div>
  }
);

function PDFViewer() {
  const [highlights, setHighlights] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfError, setPdfError] = useState(null);

  // Make sure your PDF URL is correct and the file exists in the public directory
  const url = '/sample.pdf';

  useEffect(() => {
    setIsClient(true);

    // Verify if the PDF file exists
    fetch(url)
      .then(response => {
        if (!response.ok) {
          setPdfError(`PDF file not found. Status: ${response.status}`);
        }
      })
      .catch(err => {
        setPdfError(`Error loading PDF: ${err.message}`);
      });

    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyE') {
        event.preventDefault();
        setSelectionMode(prev => {
          const newValue = !prev;
          console.log('Selection mode toggled to:', newValue);
          return newValue;
        });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [url]);

  const onSelectionFinished = async (position, content, hideTipAndSelection) => {
    const selectedText = content.text;
    setIsLoading(true);
    setExplanation('');
    setError(null);

    try {
      const response = await axios.post('/api/explain', { text: selectedText });
      setExplanation(response.data.explanation);
      hideTipAndSelection();
    } catch (error) {
      console.error('Error fetching explanation:', error);
      setError('An error occurred while fetching the explanation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state during client-side hydration
  if (!isClient) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg">Initializing PDF viewer...</div>
      </div>
    );
  }

  // Show error if PDF failed to load
  if (pdfError) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-lg text-center">
          <h2 className="font-bold mb-2">PDF Loading Error</h2>
          <p>{pdfError}</p>
          <p className="mt-2 text-sm">
            Please make sure the PDF file exists in the public directory and the path is correct.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      {/* Selection Mode Indicator */}
      {selectionMode ? (
        <div className="w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
          Selection Mode Active - Click and drag to select text
        </div>
      ) : (
        <div className="w-full max-w-2xl bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Selection Mode Inactive - Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Shift + E to activate
        </div>
      )}

      <main className="flex flex-col gap-8 items-center sm:items-start w-full">
        <div className="relative w-full" style={{ height: '80vh', position: 'relative' }}>
          <PdfLoader 
            url={url} 
            beforeLoad={
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-lg">Loading PDF...</div>
              </div>
            }
            onError={(error) => {
              console.error('PDF loading error:', error);
              setPdfError(`Failed to load PDF: ${error.message}`);
            }}
          >
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

        {isLoading && (
          <div className="mt-4 p-4 bg-gray-100 text-gray-700 rounded shadow">
            Generating explanation...
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded shadow">
            {error}
          </div>
        )}

        {explanation && (
          <div className="mt-4 p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-2">Explanation</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{explanation}</p>
          </div>
        )}
      </main>

      {/* Keyboard Shortcut Reminder */}
      <div className="text-sm text-gray-500">
        Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Shift + E to toggle selection mode
      </div>
    </div>
  );
}

export default PDFViewer;