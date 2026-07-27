"use client";

import React, { useState } from 'react';
import { Smile, Search, X } from 'lucide-react';

interface EmojiPickerPopoverProps {
  onSelect: (emoji: string) => void;
  children?: React.ReactNode;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Frequently Used',
    emojis: ['🚀', '📄', '📋', '⭐', '💡', '🔥', '🎯', '📌', '✨', '📝', '⚡', '🎉'],
  },
  {
    name: 'Objects & Symbols',
    emojis: ['📚', '💻', '🎨', '⚙️', '🔒', '🔑', '📊', '📈', '📬', '🏷️', '🛠️', '🧭'],
  },
  {
    name: 'Nature & Food',
    emojis: ['🌱', '🌲', '🌺', '☕', '🍎', '🍕', '☀️', '🌙', '🌊', '🌈', '🍀', '🌵'],
  },
  {
    name: 'Smilies & People',
    emojis: ['😀', '😎', '🧐', '🥳', '🤖', '👾', '🙌', '👏', '💪', '🧠', '👀', '💖'],
  },
];

export function EmojiPickerPopover({ onSelect, children }: EmojiPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCategories = EMOJI_CATEGORIES.map(cat => ({
    ...cat,
    emojis: cat.emojis.filter(e => !search || e.includes(search)),
  })).filter(cat => cat.emojis.length > 0);

  return (
    <div className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {children || (
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 py-1 rounded transition">
            <Smile className="w-4 h-4" /> Add Icon
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 w-72 bg-popover text-popover-foreground border shadow-xl rounded-xl p-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2 mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Select Icon</span>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search icon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted/60 pl-8 pr-3 py-1.5 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3">
              {filteredCategories.map(cat => (
                <div key={cat.name}>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {cat.name}
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {cat.emojis.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onSelect(emoji);
                          setIsOpen(false);
                        }}
                        className="text-xl p-1.5 rounded hover:bg-muted transition text-center hover:scale-110"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
