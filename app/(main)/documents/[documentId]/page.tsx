"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Image as ImageIcon, Smile, Trash2, Globe, MoreHorizontal, Sparkles } from 'lucide-react';
import { EmojiPickerPopover } from '@/components/emoji-picker-popover';
import { CoverPickerModal } from '@/components/cover-picker-modal';
import { Editor } from '@/components/editor/editor';

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.documentId as string;

  const [document, setDocument] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}`);
      if (res.ok) {
        const data = await res.json();
        setDocument(data);
        setTitle(data.title || '');
      } else {
        router.push('/');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) fetchDocument();
  }, [documentId]);

  const handleTitleBlur = async () => {
    if (title.trim() === document?.title) return;
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || 'Untitled' }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleIconSelect = async (emoji: string) => {
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon: emoji }),
      });
      fetchDocument();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCoverSelect = async (url: string) => {
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverImage: url }),
      });
      fetchDocument();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveCover = async () => {
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverImage: null }),
      });
      fetchDocument();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Loading document...
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="min-h-full pb-20 bg-background">
      {/* Top Header Controls Bar */}
      <div className="px-6 py-3 flex items-center justify-between border-b text-xs text-muted-foreground bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span>{document.icon || '📄'}</span>
          <span className="font-semibold text-foreground truncate max-w-xs">{document.title || 'Untitled'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCoverModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-muted font-medium transition"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{document.coverImage ? 'Change Cover' : 'Add Cover'}</span>
          </button>

          <EmojiPickerPopover onSelect={handleIconSelect}>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-muted font-medium transition">
              <Smile className="w-3.5 h-3.5" />
              <span>Change Icon</span>
            </button>
          </EmojiPickerPopover>
        </div>
      </div>

      {/* Cover Image Header */}
      {document.coverImage && (
        <div className="relative w-full h-52 group">
          <img src={document.coverImage} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition flex gap-2">
            <button
              onClick={() => setIsCoverModalOpen(true)}
              className="px-2.5 py-1 bg-black/60 text-white rounded text-xs hover:bg-black/80 backdrop-blur-xs transition"
            >
              Change Cover
            </button>
            <button
              onClick={handleRemoveCover}
              className="px-2.5 py-1 bg-black/60 text-white rounded text-xs hover:bg-black/80 backdrop-blur-xs transition"
            >
              Remove Cover
            </button>
          </div>
        </div>
      )}

      {/* Document Content Canvas */}
      <div className="max-w-4xl mx-auto px-8 pt-8 space-y-4">
        {/* Document Icon & Action Options */}
        <div className="flex items-center gap-3">
          <EmojiPickerPopover onSelect={handleIconSelect}>
            <span className="text-5xl cursor-pointer hover:scale-110 transition inline-block">
              {document.icon || '📄'}
            </span>
          </EmojiPickerPopover>

          {!document.coverImage && (
            <button
              onClick={() => setIsCoverModalOpen(true)}
              className="text-xs text-muted-foreground hover:bg-muted px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1"
            >
              <ImageIcon className="w-3.5 h-3.5" /> Add Cover Image
            </button>
          )}
        </div>

        {/* Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Untitled"
            className="w-full text-4xl font-bold bg-transparent outline-none border-none placeholder:text-muted-foreground/50 tracking-tight"
          />
        </div>

        {/* Core Block Editor Engine */}
        <Editor
          documentId={documentId}
          initialContent={document.content}
          databases={document.databases || []}
          onRefreshDocument={fetchDocument}
        />
      </div>

      {/* Cover Picker Modal */}
      <CoverPickerModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onSelect={handleCoverSelect}
      />
    </div>
  );
}
