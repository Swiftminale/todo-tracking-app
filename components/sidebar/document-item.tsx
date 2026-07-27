"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, Trash2, Edit3, FileText, CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiPickerPopover } from '@/components/emoji-picker-popover';

interface DocumentItemProps {
  document: {
    id: string;
    title: string;
    icon?: string | null;
    parentDocumentId?: string | null;
  };
  level?: number;
  onRefresh: () => void;
}

export function DocumentItem({ document: doc, level = 0, onRefresh }: DocumentItemProps) {
  const router = useRouter();
  const params = useParams();
  const activeDocumentId = params?.documentId as string;

  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(doc.title);

  const isActive = activeDocumentId === doc.id;

  const fetchChildren = async () => {
    setLoadingChildren(true);
    try {
      const res = await fetch(`/api/documents?parentDocumentId=${doc.id}`);
      if (res.ok) {
        const data = await res.json();
        setChildren(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChildren(false);
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      fetchChildren();
    }
    setIsExpanded(!isExpanded);
  };

  const handleCreateSubPage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled',
          icon: '📄',
          parentDocumentId: doc.id,
        }),
      });
      if (res.ok) {
        const newDoc = await res.json();
        setIsExpanded(true);
        fetchChildren();
        onRefresh();
        router.push(`/documents/${newDoc.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true }),
      });
      onRefresh();
      if (isActive) router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRenaming(false);
    if (title.trim() === doc.title) return;
    try {
      await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || 'Untitled' }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleIconSelect = async (emoji: string) => {
    try {
      await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon: emoji }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div
        onClick={() => router.push(`/documents/${doc.id}`)}
        style={{ paddingLeft: `${level * 14 + 12}px` }}
        className={cn(
          "group flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition select-none",
          isActive && "bg-accent text-accent-foreground font-semibold"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 pr-1">
          <button
            onClick={toggleExpand}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          <EmojiPickerPopover onSelect={handleIconSelect}>
            <span className="text-sm flex-shrink-0 hover:scale-110 transition">{doc.icon || '📄'}</span>
          </EmojiPickerPopover>

          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex-1">
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsRenaming(false)}
                className="w-full bg-background px-1.5 py-0.5 rounded text-xs outline-none border focus:ring-1 focus:ring-primary"
              />
            </form>
          ) : (
            <span className="truncate">{doc.title || 'Untitled'}</span>
          )}
        </div>

        {/* Hover action items */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={handleCreateSubPage}
            title="Create Sub-page"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              title="More Actions"
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-popover text-popover-foreground border shadow-xl rounded-lg p-1 text-xs space-y-0.5 animate-in fade-in">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      setIsRenaming(true);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted transition text-left"
                  >
                    <Edit3 className="w-3 h-3" /> Rename
                  </button>
                  <button
                    onClick={handleArchive}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition text-left"
                  >
                    <Trash2 className="w-3 h-3" /> Move to Trash
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nested Children Tree */}
      {isExpanded && (
        <div className="space-y-0.5">
          {loadingChildren ? (
            <div className="text-[11px] text-muted-foreground pl-8 py-1">Loading...</div>
          ) : children.length === 0 ? (
            <div className="text-[11px] text-muted-foreground/60 italic pl-9 py-1 flex items-center gap-1">
              <CornerDownRight className="w-3 h-3" /> No sub-pages
            </div>
          ) : (
            children.map((childDoc) => (
              <DocumentItem
                key={childDoc.id}
                document={childDoc}
                level={level + 1}
                onRefresh={() => {
                  fetchChildren();
                  onRefresh();
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
