"use client";

import React, { useState } from 'react';
import { X, Calendar, CheckSquare, Tag, AlignLeft, Trash2 } from 'lucide-react';

interface RowPeekDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  row: any;
  properties: any[];
  onUpdateRow: (rowId: string, updatedProps: any) => void;
  onDeleteRow: (rowId: string) => void;
}

export function RowPeekDrawer({
  isOpen,
  onClose,
  row,
  properties,
  onUpdateRow,
  onDeleteRow,
}: RowPeekDrawerProps) {
  if (!isOpen || !row) return null;

  const parsedRowProps = typeof row.properties === 'string' ? JSON.parse(row.properties) : row.properties || {};

  const handlePropChange = (propIdOrName: string, val: any) => {
    const updated = { ...parsedRowProps, [propIdOrName]: val };
    onUpdateRow(row.id, updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-popover border-l text-popover-foreground w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Row Peek View</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDeleteRow(row.id);
                onClose();
              }}
              title="Delete Row"
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950 text-red-600 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={parsedRowProps['Name'] || parsedRowProps['title'] || ''}
              onChange={(e) => handlePropChange('Name', e.target.value)}
              placeholder="Untitled Row"
              className="text-2xl font-bold bg-transparent w-full focus:outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Properties List */}
          <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
            {properties.map((prop) => {
              const value = parsedRowProps[prop.id] !== undefined ? parsedRowProps[prop.id] : parsedRowProps[prop.name];

              return (
                <div key={prop.id} className="grid grid-cols-3 gap-2 items-center text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium">
                    {prop.type === 'SELECT' && <Tag className="w-3.5 h-3.5 text-blue-500" />}
                    {prop.type === 'CHECKBOX' && <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />}
                    {prop.type === 'DATE' && <Calendar className="w-3.5 h-3.5 text-purple-500" />}
                    {prop.type === 'TEXT' && <AlignLeft className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{prop.name}</span>
                  </div>

                  <div className="col-span-2">
                    {prop.type === 'CHECKBOX' ? (
                      <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => handlePropChange(prop.id, e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                    ) : prop.type === 'SELECT' ? (
                      <select
                        value={value || ''}
                        onChange={(e) => handlePropChange(prop.id, e.target.value)}
                        className="w-full bg-background border px-2.5 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Select --</option>
                        {(() => {
                          const options = prop.options ? JSON.parse(prop.options) : [];
                          return options.map((opt: any) => (
                            <option key={opt.id || opt.name} value={opt.name}>
                              {opt.name}
                            </option>
                          ));
                        })()}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handlePropChange(prop.id, e.target.value)}
                        className="w-full bg-background border px-2.5 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>Row created at: {new Date(row.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
