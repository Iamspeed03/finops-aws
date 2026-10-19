"use client";

import React from 'react';
import { Download } from 'lucide-react';

export default function DownloadButton({ content, filename }: { content: string, filename: string }) {
  const handleDownload = () => {
    // Generates a local Blob URL to securely download the data without exposing AWS credentials
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={handleDownload} 
      className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-neutral-800 transition-colors shadow-sm"
    >
      <Download size={16} /> 
      Export Audit Log (.txt)
    </button>
  );
}