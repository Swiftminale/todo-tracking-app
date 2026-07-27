"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, X } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search modal
          window.dispatchEvent(new CustomEvent('open-search-modal'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/documents/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 200);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-popover border text-popover-foreground w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden m-4 animate-in zoom-in-95">
        <div className="flex items-center px-4 border-b">
          <Search className="w-4 h-4 text-muted-foreground mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Search pages or documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-4 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Searching workspace...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">No matching pages found</div>
          ) : (
            <div className="space-y-1">
              {results.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    router.push(`/documents/${doc.id}`);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/80 cursor-pointer group transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{doc.icon || '📄'}</span>
                    <span className="text-xs font-medium text-foreground group-hover:text-primary">
                      {doc.title || 'Untitled'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Page
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-muted/40 border-t px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px]">ESC</kbd> to close</span>
          <span><kbd className="px-1.5 py-0.5 bg-background border rounded text-[10px]">⌘K</kbd> Quick Search</span>
        </div>
      </div>
    </div>
  );
}
