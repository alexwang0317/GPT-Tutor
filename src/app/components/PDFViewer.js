'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Dynamically import components to handle SSR
const PdfLoader = dynamic(
  () => import('react-pdf-highlighter').then(mod => mod.PdfLoader),
  { 
    ssr: false,
    loading: () => <div className="tw-flex tw-items-center tw-justify-center tw-h-full">Loading PDF components...</div>
  }
);

const PdfHighlighter = dynamic(
  () => import('react-pdf-highlighter').then(mod => mod.PdfHighlighter),
  { ssr: false }
);

// Constants for zooming
const DEFAULT_SCALE = 1;
const ZOOM_STEP = 0.1;
const MAX_SCALE = 3;
const MIN_SCALE = 0.5;

function PDFViewer() {
  const viewerContainerRef = useRef(null); // Reference to the scrollable container
  const [highlights, setHighlights] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [isMac, setIsMac] = useState(false);

  const url = '/sample.pdf';

  // Detect if running on client and check if user is on a Mac
  useEffect(() => {
    setIsClient(true);
    setIsMac(window.navigator.userAgent.toLowerCase().includes('mac'));
  }, []);

  // Keyboard shortcuts for selection mode and zooming
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyE') {
        event.preventDefault();
        setSelectionMode(prev => !prev);
      }

      if (event.ctrlKey || event.metaKey) {
        if (event.code === 'Equal' || event.code === 'Plus') {
          event.preventDefault();
          setScale(prev => Math.min(prev + ZOOM_STEP, MAX_SCALE));
        } else if (event.code === 'Minus') {
          event.preventDefault();
          setScale(prev => Math.max(prev - ZOOM_STEP, MIN_SCALE));
        } else if (event.code === 'Digit0') {
          event.preventDefault();
          setScale(DEFAULT_SCALE);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle text selection and fetch explanation from API
  const onSelectionFinished = useCallback(async (position, content, hideTipAndSelection) => {
    if (!content?.text?.trim()) {
      return;
    }

    setIsLoading(true);
    setExplanation('');
    setError(null);

    try {
      const response = await axios.post('/api/explain', { 
        text: content.text.trim() 
      });

      if (response.data?.explanation) {
        setExplanation(response.data.explanation);
        setHighlights(prev => [...prev, {
          ...position,
          content,
          timestamp: new Date().toISOString()
        }]);
        hideTipAndSelection();
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching explanation:', error);
      setError(error.response?.data?.message || 'An error occurred while fetching the explanation.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + ZOOM_STEP, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - ZOOM_STEP, MIN_SCALE));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(DEFAULT_SCALE);
  }, []);

  // Helper to display correct modifier key
  const getModifierKey = () => isMac ? '⌘' : 'Ctrl';

  if (!isClient) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-screen">
        <div className="tw-animate-pulse">Initializing viewer...</div>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-h-screen tw-overflow-hidden">
      {/* PDF Viewer Container with proper positioning context */}
      <div className="tw-flex-1 tw-flex tw-flex-col">
        {/* Header bar with fixed height */}
        <div className="tw-h-16 tw-px-4 tw-border-b tw-border-gray-200">
          <div className="tw-h-full tw-flex tw-justify-between tw-items-center">
            <div className={`tw-rounded-lg tw-px-4 tw-py-2 ${
              selectionMode 
                ? 'tw-bg-blue-50 tw-border tw-border-blue-200 tw-text-blue-800'
                : 'tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-text-yellow-800'
            }`}>
              {selectionMode 
                ? 'Selection Mode Active - Click and drag to select text'
                : `Selection Mode Inactive - Press ${getModifierKey()} + Shift + E to activate`
              }
            </div>
            
            <div className="tw-flex tw-items-center tw-gap-2">
              <button
                onClick={handleZoomOut}
                className="tw-p-2 tw-rounded tw-bg-gray-100 hover:tw-bg-gray-200"
                disabled={scale <= MIN_SCALE}
              >
                -
              </button>
              <button
                onClick={handleResetZoom}
                className="tw-p-2 tw-rounded tw-bg-gray-100 hover:tw-bg-gray-200"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="tw-p-2 tw-rounded tw-bg-gray-100 hover:tw-bg-gray-200"
                disabled={scale >= MAX_SCALE}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="tw-relative tw-flex-1">
          <PdfLoader 
            url={url} 
            beforeLoad={
              <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
                <div className="tw-animate-pulse">Loading PDF...</div>
              </div>
            }
            onError={(error) => setError(`Failed to load PDF: ${error.message}`)}
          >
            {(pdfDocument) => (
              <div
                className="tw-absolute tw-inset-0"
                style={{ position: 'relative' }}
              >
                {/* Scrollable Container */}
                <div
                  ref={viewerContainerRef}
                  className="tw-absolute tw-inset-0 tw-overflow-auto"
                  style={{ position: 'absolute', left: 0, top: 0 }}
                >
                  <PdfHighlighter
                    pdfDocument={pdfDocument}
                    enableAreaSelection={selectionMode}
                    onSelectionFinished={onSelectionFinished}
                    highlights={highlights}
                    scale={scale}
                    onDocumentReady={(pdf) => setPdfDocument(pdf)}
                    scrollRef={viewerContainerRef}
                  />
                </div>
              </div>
            )}
          </PdfLoader>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="tw-w-96 tw-border-l tw-border-gray-200 tw-bg-white tw-overflow-y-auto">
        <div className="tw-p-4">
          <h2 className="tw-text-xl tw-font-bold tw-mb-4">Highlights & Explanations</h2>
          
          {isLoading && (
            <div className="tw-mb-4 tw-p-4 tw-bg-gray-100 tw-text-gray-700 tw-rounded tw-shadow tw-animate-pulse">
              Generating explanation...
            </div>
          )}
          
          {error && (
            <div className="tw-mb-4 tw-p-4 tw-bg-red-100 tw-text-red-700 tw-rounded tw-shadow">
              {error}
            </div>
          )}

          {highlights.length === 0 && !explanation && !isLoading && (
            <div className="tw-text-gray-500 tw-italic">
              No highlights yet. Select text in the PDF to get explanations.
            </div>
          )}

          {explanation && (
            <div className="tw-p-4 tw-bg-white tw-rounded tw-shadow tw-border tw-border-gray-200 tw-mb-4">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-2">Latest Explanation</h3>
              <p className="tw-text-gray-700 tw-whitespace-pre-wrap">{explanation}</p>
            </div>
          )}

          {highlights.length > 0 && (
            <div className="tw-space-y-4">
              <h3 className="tw-text-lg tw-font-semibold">Previous Highlights</h3>
              {highlights.map((highlight) => (
                <div 
                  key={highlight.timestamp} 
                  className="tw-p-3 tw-bg-gray-50 tw-rounded tw-border tw-border-gray-200"
                >
                  <div className="tw-text-sm tw-text-gray-600 tw-mb-1">
                    Selected text:
                  </div>
                  <div className="tw-text-gray-800">
                    {highlight.content.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="tw-mt-4 tw-p-4 tw-bg-gray-50 tw-rounded">
            <h3 className="tw-text-sm tw-font-semibold tw-mb-2">Keyboard Shortcuts</h3>
            <ul className="tw-text-sm tw-text-gray-600 tw-space-y-1">
              <li>• {getModifierKey()} + Shift + E: Toggle selection mode</li>
              <li>• {getModifierKey()} + Plus: Zoom in</li>
              <li>• {getModifierKey()} + Minus: Zoom out</li>
              <li>• {getModifierKey()} + 0: Reset zoom</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;
