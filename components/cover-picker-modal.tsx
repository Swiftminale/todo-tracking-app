"use client";

import React, { useState } from 'react';
import { Image as ImageIcon, Link, X, Check } from 'lucide-react';

interface CoverPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
];

export function CoverPickerModal({ isOpen, onClose, onSelect }: CoverPickerModalProps) {
  const [tab, setTab] = useState<'gallery' | 'url'>('gallery');
  const [customUrl, setCustomUrl] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onSelect(customUrl.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-popover border text-popover-foreground w-full max-w-lg rounded-2xl shadow-2xl p-5 m-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <ImageIcon className="w-4 h-4 text-primary" /> Select Document Cover
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex gap-4 border-b mb-4 text-xs font-medium">
          <button
            onClick={() => setTab('gallery')}
            className={`pb-2 border-b-2 transition ${
              tab === 'gallery'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Gallery Presets
          </button>
          <button
            onClick={() => setTab('url')}
            className={`pb-2 border-b-2 transition ${
              tab === 'url'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Custom Image URL
          </button>
        </div>

        {tab === 'gallery' ? (
          <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {PRESET_COVERS.map((url, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelect(url);
                  onClose();
                }}
                className="group relative h-24 rounded-lg overflow-hidden cursor-pointer border hover:border-primary transition"
              >
                <img src={url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Paste image web URL</label>
              <div className="relative">
                <Link className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full bg-muted/60 pl-9 pr-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs rounded-lg hover:bg-muted font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition shadow-sm"
              >
                Set Cover
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
