"use client";

import React, { useState, useEffect } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  AlertCircle,
  Table,
  Type
} from 'lucide-react';

interface SlashCommandProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (command: string) => void;
  position: { top: number; left: number };
}

const COMMANDS = [
  { id: 'text', label: 'Text', icon: Type, description: 'Plain text paragraph' },
  { id: 'h1', label: 'Heading 1', icon: Heading1, description: 'Large section heading' },
  { id: 'h2', label: 'Heading 2', icon: Heading2, description: 'Medium section heading' },
  { id: 'h3', label: 'Heading 3', icon: Heading3, description: 'Small section heading' },
  { id: 'bullet', label: 'Bullet List', icon: List, description: 'Create a simple bulleted list' },
  { id: 'numbered', label: 'Numbered List', icon: ListOrdered, description: 'Create a numbered list' },
  { id: 'todo', label: 'To-Do List', icon: CheckSquare, description: 'Track tasks with checkboxes' },
  { id: 'quote', label: 'Quote', icon: Quote, description: 'Capture a quote or highlight' },
  { id: 'code', label: 'Code Block', icon: Code, description: 'Code snippet with formatting' },
  { id: 'table', label: 'Inline Database Table', icon: Table, description: 'Embed a Notion-style table / kanban board' },
];

export function SlashCommandPopover({ isOpen, onClose, onSelect, position }: SlashCommandProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState('');

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) {
      setFilter('');
      setSelectedIndex(0);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        className="fixed z-50 w-72 max-h-80 overflow-y-auto bg-popover text-popover-foreground border shadow-2xl rounded-xl p-1.5 animate-in fade-in zoom-in-95"
      >
        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Basic Blocks
        </div>
        {filteredCommands.map((cmd, index) => {
          const Icon = cmd.icon;
          const isSelected = index === selectedIndex;
          return (
            <div
              key={cmd.id}
              onClick={() => {
                onSelect(cmd.id);
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition ${
                isSelected ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted'
              }`}
            >
              <div className="p-1.5 rounded-md bg-muted/60 border text-foreground">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium">{cmd.label}</span>
                <span className="text-[10px] text-muted-foreground truncate">{cmd.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
