"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshSidebar?: () => void;
}

export function TrashModal({ isOpen, onClose, onRefreshSidebar }: TrashModalProps) {
  const router = useRouter();
  const [archivedDocs, setArchivedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents/trash');
      if (res.ok) {
        const data = await res.json();
        setArchivedDocs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchTrash();
  }, [isOpen]);

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false }),
      });
      fetchTrash();
      if (onRefreshSidebar) onRefreshSidebar();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      fetchTrash();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-popover border-l text-popover-foreground w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Trash2 className="w-4 h-4 text-destructive" /> Trash & Archived Pages
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-10 text-xs text-muted-foreground">Loading trash...</div>
          ) : archivedDocs.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Trash is empty
            </div>
          ) : (
            archivedDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/documents/${doc.id}`)}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="text-base flex-shrink-0">{doc.icon || '📄'}</span>
                  <span className="text-xs font-medium truncate">{doc.title || 'Untitled'}</span>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => handleRestore(doc.id, e)}
                    title="Restore Page"
                    className="p-1.5 rounded hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 text-muted-foreground transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handlePermanentDelete(doc.id, e)}
                    title="Delete Permanently"
                    className="p-1.5 rounded hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-300 text-muted-foreground transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-muted/30 text-[11px] text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          Restoring pages brings back child nested pages automatically.
        </div>
      </div>
    </div>
  );
}
