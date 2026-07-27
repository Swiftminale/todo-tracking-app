"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';

import {
  Bold,
  Italic,
  Strikethrough,
  Code as CodeIcon,
  Highlighter,
  Check
} from 'lucide-react';

import { SlashCommandPopover } from './slash-command';
import { DatabaseView } from '@/components/database/database-view';

interface EditorProps {
  documentId: string;
  initialContent?: string | null;
  onSave?: (content: any) => void;
  databases?: any[];
  onRefreshDocument?: () => void;
}

export function Editor({ documentId, initialContent, onSave, databases = [], onRefreshDocument }: EditorProps) {
  const [mounted, setMounted] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving'>('saved');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const parseContent = (contentString?: string | null) => {
    if (!contentString) return undefined;
    try {
      return JSON.parse(contentString);
    } catch (e) {
      return contentString;
    }
  };

  const triggerSave = useCallback(
    (jsonContent: any) => {
      setSavingStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/documents/${documentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: jsonContent }),
          });
          setSavingStatus('saved');
          if (onSave) onSave(jsonContent);
        } catch (err) {
          console.error('[AUTO_SAVE_ERROR]', err);
        }
      }, 500);
    },
    [documentId, onSave]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands or start typing...",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Color,
      TextStyle,
      Link.configure({ openOnClick: false }),
    ],
    content: parseContent(initialContent),
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      triggerSave(json);

      const { selection } = editor.state;
      const { $from } = selection;
      const textBefore = $from.parent.textBetween(
        Math.max(0, $from.parentOffset - 1),
        $from.parentOffset,
        undefined,
        '\uFFFC'
      );

      if (textBefore === '/') {
        const domPos = editor.view.coordsAtPos($from.pos);
        setSlashPos({ top: domPos.bottom + 4, left: domPos.left });
        setSlashOpen(true);
      } else if (slashOpen && textBefore !== '/') {
        setSlashOpen(false);
      }
    },
  });

  const handleSlashSelect = async (command: string) => {
    if (!editor) return;

    editor.commands.deleteRange({
      from: editor.state.selection.from - 1,
      to: editor.state.selection.from,
    });

    switch (command) {
      case 'text':
        editor.chain().focus().setParagraph().run();
        break;
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'bullet':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'numbered':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'todo':
        editor.chain().focus().toggleTaskList().run();
        break;
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'code':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'table':
        try {
          const res = await fetch('/api/databases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId, title: 'Project Tracker' }),
          });
          if (res.ok && onRefreshDocument) {
            onRefreshDocument();
          }
        } catch (e) {
          console.error(e);
        }
        break;
      default:
        break;
    }
  };

  if (!mounted || !editor) return null;

  return (
    <div className="relative w-full max-w-4xl mx-auto px-6 py-4">
      {/* Auto-save Status Indicator */}
      <div className="absolute right-6 top-2 text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 opacity-70">
        {savingStatus === 'saving' ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Saving...
          </>
        ) : (
          <>
            <Check className="w-3 h-3 text-emerald-500" />
            Saved
          </>
        )}
      </div>

      {/* Inline Selection Bubble Menu */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }}>
          <div className="flex items-center gap-0.5 bg-popover border shadow-xl rounded-lg p-1 text-popover-foreground">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded hover:bg-muted ${editor.isActive('bold') ? 'bg-accent text-primary' : ''}`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded hover:bg-muted ${editor.isActive('italic') ? 'bg-accent text-primary' : ''}`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded hover:bg-muted ${editor.isActive('strike') ? 'bg-accent text-primary' : ''}`}
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1.5 rounded hover:bg-muted ${editor.isActive('code') ? 'bg-accent text-primary' : ''}`}
              title="Code"
            >
              <CodeIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`p-1.5 rounded hover:bg-muted ${editor.isActive('highlight') ? 'bg-accent text-primary' : ''}`}
              title="Highlight"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>
        </BubbleMenu>
      )}

      {/* TipTap Main Content Canvas */}
      <EditorContent editor={editor} />

      {/* Slash Command Popover */}
      <SlashCommandPopover
        isOpen={slashOpen}
        onClose={() => setSlashOpen(false)}
        onSelect={handleSlashSelect}
        position={slashPos}
      />

      {/* Render Inline Databases */}
      {databases.length > 0 && (
        <div className="mt-8 space-y-10 border-t pt-8">
          {databases.map((db) => (
            <DatabaseView key={db.id} database={db} onRefresh={onRefreshDocument} />
          ))}
        </div>
      )}
    </div>
  );
}
