'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Dynamically import PDF components with loading fallback
const PdfLoader = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.Document),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading PDF components...</div>
  }
);

const PdfHighlighter = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.Page),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading highlighter...</div>
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

  // Make sure your PDF URL is correct and accessible
  const url = '/sample.pdf';

  useEffect(() => {
    // Set client-side rendering flag
    setIsClient(true);

    // Check if PDF exists and is accessible
    const checkPdfAccess = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          setPdfError(`PDF file not found. Status: ${response.status}`);
        }
      } catch (err) {
        setPdfError(`Error loading PDF: ${err.message}`);
      }
    };

    checkPdfAccess();

    // Keyboard shortcut handler
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyE') {
        event.preventDefault();
        setSelectionMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [url]);

  const onSelectionFinished = async (position, content, hideTipAndSelection) => {
    if (!content?.text) return;
    
    setIsLoading(true);
    setExplanation('');
    setError(null);

    try {
      const response = await axios.post('/api/explain', { 
        text: content.text 
      });
      
      if (response.data?.explanation) {
        setExplanation(response.data.explanation);
        if (hideTipAndSelection) hideTipAndSelection();
      }
    } catch (err) {
      console.error('Error fetching explanation:', err);
      setError('Failed to generate explanation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle client-side hydration
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading PDF viewer...</div>
      </div>
    );
  }

  // Handle PDF loading errors
  if (pdfError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg max-w-lg text-center">
          <h2 className="font-bold text-xl mb-2">PDF Loading Error</h2>
          <p className="mb-2">{pdfError}</p>
          <p className="text-sm text-red-600">
            Please verify that the PDF file exists and is accessible at {url}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-8">
      {/* Mode Indicator */}
      <div className={`w-full max-w-2xl mx-auto mb-4 p-4 rounded-lg ${
        selectionMode 
          ? 'bg-blue-50 border border-blue-200 text-blue-800'
          : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
      }`}>
        {selectionMode 
          ? 'Selection Mode Active - Click and drag to select text'
          : `Selection Mode Inactive - Press ${
              navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'
            } + Shift + E to activate`
        }
      </div>

      {/* PDF Viewer */}
      <div className="flex-grow relative w-full h-[calc(100vh-200px)]">
        <PdfLoader
          file={url}
          error={
            <div className="flex items-center justify-center h-full text-red-600">
              Failed to load PDF
            </div>
          }
          loading={
            <div className="flex items-center justify-center h-full">
              Loading PDF...
            </div>
          }
        >
          {(document) => (
            <PdfHighlighter
              document={document}
              enableAreaSelection={selectionMode}
              onSelectionFinished={onSelectionFinished}
              highlights={highlights}
              scrollRef={(scrollTo) => {
                // Scroll handler if needed
              }}
            />
          )}
        </PdfLoader>
      </div>

      {/* Status Messages */}
      <div className="w-full max-w-2xl mx-auto mt-4">
        {isLoading && (
          <div className="p-4 bg-gray-100 text-gray-700 rounded shadow animate-pulse">
            Generating explanation...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded shadow">
            {error}
          </div>
        )}

        {explanation && (
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-2">Explanation</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{explanation}</p>
          </div>
        )}
      </div>

      {/* Shortcut Reminder */}
      <div className="text-center text-sm text-gray-500 mt-4">
        Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Shift + E to toggle selection mode
      </div>
    </div>
  );
}

export default PDFViewer;