'use client';

import { useState, useEffect } from 'react';
import { PdfLoader, PdfHighlighter } from 'react-pdf-highlighter';
import axios from 'axios';
import Image from "next/image";

export default function PDFViewer() {
  const [highlights, setHighlights] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [explanation, setExplanation] = useState('');
  const url = '/sample.pdf';

  useEffect(() => {
    let lastTap = 0;

    function handleKeyDown(event) {
      if (event.code === 'Space') {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;

        if (tapLength < 500 && tapLength > 0) {
          setSelectionMode(true);
        }
        lastTap = currentTime;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function onSelectionFinished(position, content, hideTipAndSelection) {
    const selectedText = content.text;
    hideTipAndSelection();
    setSelectionMode(false);

    try {
      const response = await axios.post('/api/explain', { text: selectedText });
      setExplanation(response.data.explanation);
    } catch (error) {
      console.error('Error fetching explanation:', error);
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full">
        <div className="relative w-full" style={{ height: "80vh" }}>
          <PdfLoader url={url} beforeLoad={<div>Loading PDF...</div>}>
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={() => selectionMode}
                onSelectionFinished={onSelectionFinished}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
        
        {explanation && (
          <div className="explanation">
            <h2>Explanation</h2>
            <p>{explanation}</p>
          </div>
        )}
      </main>
    </div>
  );
}

