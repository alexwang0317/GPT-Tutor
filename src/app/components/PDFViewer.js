'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfLoader = dynamic(
  () => import('react-pdf-highlighter').then(mod => mod.PdfLoader),
  { ssr: false }
);

const PdfHighlighter = dynamic(
  () => import('react-pdf-highlighter').then(mod => mod.PdfHighlighter),
  { ssr: false }
);

const DEFAULT_SCALE = 1;

function PDFViewer() {
  const viewerContainerRef = useRef(null);
  const [highlights, setHighlights] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);

  const url = '/sample.pdf';

  useEffect(() => {
    setIsClient(true);

    function handleKeyDown(event) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.code === 'KeyE'
      ) {
        event.preventDefault();
        setSelectionMode(prev => !prev);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onSelectionFinished = async (position, content, hideTipAndSelection) => {
    if (content.text) {
      setIsLoading(true);
      setExplanation('');
      setError(null);

      try {
        const response = await axios.post('/api/explain', { text: content.text });
        setExplanation(response.data.explanation);
        hideTipAndSelection();
      } catch (error) {
        console.error('Error fetching explanation:', error);
        setError('An error occurred while fetching the explanation.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left side - PDF Viewer */}
      <div className="flex-1 relative">
        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          {selectionMode ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
              Selection Mode Active - Click and drag to select text
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
              Selection Mode Inactive - Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Shift + E to activate
            </div>
          )}
        </div>

        {/* PDF Container */}
        <div 
          ref={viewerContainerRef}
          style={{
            position: 'absolute',
            top: '80px', // Account for status bar
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto'
          }}>
            <PdfLoader url={url} beforeLoad={<div>Loading PDF...</div>}>
              {pdfDocument => (
                <PdfHighlighter
                  pdfDocument={pdfDocument}
                  enableAreaSelection={selectionMode}
                  onSelectionFinished={onSelectionFinished}
                  highlights={highlights}
                  scale={scale}
                />
              )}
            </PdfLoader>
          </div>
        </div>
      </div>

      {/* Right side - Results Panel */}
      <div className="w-96 overflow-y-auto border-l border-gray-200 bg-white p-4">
        {isLoading && (
          <div className="mb-4 p-4 bg-gray-100 text-gray-700 rounded shadow">
            Generating explanation...
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded shadow">
            {error}
          </div>
        )}

        {explanation && (
          <div className="p-4 bg-white rounded shadow border border-gray-200">
            <h2 className="text-xl font-bold mb-2">Explanation</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{explanation}</p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Shift + E to toggle selection mode
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;