"use client";

import React, { useState } from 'react';
import { Table as TableIcon, LayoutGrid, Plus, MoreHorizontal, Check, Trash2, Tag, Calendar, CheckSquare, AlignLeft } from 'lucide-react';
import { RowPeekDrawer } from './row-peek-drawer';

interface DatabaseViewProps {
  database: {
    id: string;
    title: string;
    properties: any[];
    rows: any[];
  };
  onRefresh?: () => void;
}

export function DatabaseView({ database: db, onRefresh }: DatabaseViewProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [showAddPropModal, setShowAddPropModal] = useState(false);

  const [newPropName, setNewPropName] = useState('');
  const [newPropType, setNewPropType] = useState('TEXT');

  const rows = db.rows || [];
  const properties = db.properties || [];

  const handleAddRow = async () => {
    try {
      const defaultProps: any = { Name: 'New Task' };
      const res = await fetch('/api/rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          databaseId: db.id,
          properties: defaultProps,
        }),
      });
      if (res.ok && onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRow = async (rowId: string, updatedProps: any) => {
    try {
      await fetch('/api/rows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowId,
          properties: updatedProps,
        }),
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    try {
      await fetch(`/api/rows?rowId=${rowId}`, { method: 'DELETE' });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;

    try {
      let options = null;
      if (newPropType === 'SELECT') {
        options = [
          { id: '1', name: 'Option 1', color: 'bg-blue-100 text-blue-700' },
          { id: '2', name: 'Option 2', color: 'bg-emerald-100 text-emerald-700' },
        ];
      }

      await fetch(`/api/databases/${db.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addProperty: {
            name: newPropName.trim(),
            type: newPropType,
            options,
          },
        }),
      });

      setNewPropName('');
      setShowAddPropModal(false);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const statusProp = properties.find((p) => p.name === 'Status') || properties.find((p) => p.type === 'SELECT');
  let kanbanColumns = [
    { id: '1', name: 'To Do' },
    { id: '2', name: 'In Progress' },
    { id: '3', name: 'Done' },
  ];

  if (statusProp && statusProp.options) {
    try {
      const parsed = JSON.parse(statusProp.options);
      if (Array.isArray(parsed) && parsed.length > 0) {
        kanbanColumns = parsed;
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="w-full bg-card border rounded-2xl p-4 shadow-sm space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{db.title || 'Inline Database'}</span>

          {/* View Mode Switcher */}
          <div className="flex bg-muted p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                viewMode === 'table' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Table View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                viewMode === 'kanban' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Board View
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddPropModal(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-muted font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Property
          </button>
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> New Row
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-2.5 font-semibold text-muted-foreground w-12 text-center">#</th>
                {properties.map((prop) => (
                  <th key={prop.id} className="p-2.5 font-semibold text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {prop.type === 'SELECT' && <Tag className="w-3 h-3 text-blue-500" />}
                      {prop.type === 'CHECKBOX' && <CheckSquare className="w-3 h-3 text-emerald-500" />}
                      {prop.type === 'DATE' && <Calendar className="w-3 h-3 text-purple-500" />}
                      {prop.type === 'TEXT' && <AlignLeft className="w-3 h-3 text-slate-500" />}
                      <span>{prop.name}</span>
                    </div>
                  </th>
                ))}
                <th className="p-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, idx) => {
                let parsedProps = {};
                if (typeof row.properties === 'string') {
                  try {
                    parsedProps = JSON.parse(row.properties);
                  } catch (e) {
                    parsedProps = {};
                  }
                } else if (row.properties) {
                  parsedProps = row.properties;
                }

                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRow(row)}
                    className="hover:bg-muted/40 cursor-pointer group transition"
                  >
                    <td className="p-2.5 text-center text-muted-foreground font-mono text-[11px]">{idx + 1}</td>
                    {properties.map((prop) => {
                      const val = (parsedProps as any)[prop.id] !== undefined ? (parsedProps as any)[prop.id] : (parsedProps as any)[prop.name];

                      return (
                        <td key={prop.id} className="p-2.5">
                          {prop.type === 'CHECKBOX' ? (
                            <input
                              type="checkbox"
                              checked={!!val}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleUpdateRow(row.id, { ...parsedProps, [prop.id]: e.target.checked });
                              }}
                              className="w-4 h-4 accent-primary rounded cursor-pointer"
                            />
                          ) : prop.type === 'SELECT' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {val || 'None'}
                            </span>
                          ) : (
                            <span className="truncate block font-medium">{val || '—'}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(row.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-3 gap-4">
          {kanbanColumns.map((col: any) => {
            const columnRows = rows.filter((row) => {
              let parsed: any = {};
              if (typeof row.properties === 'string') {
                try {
                  parsed = JSON.parse(row.properties);
                } catch (e) {
                  parsed = {};
                }
              } else if (row.properties) {
                parsed = row.properties;
              }
              const statusVal = parsed[statusProp?.id || 'Status'] || parsed['Status'];
              return statusVal === col.name;
            });

            return (
              <div key={col.id || col.name} className="bg-muted/40 p-3 rounded-xl border flex flex-col min-h-60 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-xs font-bold text-foreground">{col.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                    {columnRows.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {columnRows.map((row) => {
                    let parsed: any = {};
                    if (typeof row.properties === 'string') {
                      try {
                        parsed = JSON.parse(row.properties);
                      } catch (e) {
                        parsed = {};
                      }
                    } else if (row.properties) {
                      parsed = row.properties;
                    }

                    return (
                      <div
                        key={row.id}
                        onClick={() => setSelectedRow(row)}
                        className="bg-card border p-3 rounded-lg shadow-2xs hover:shadow-md cursor-pointer transition space-y-2"
                      >
                        <span className="text-xs font-semibold block">{parsed['Name'] || parsed['title'] || 'Untitled Card'}</span>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{parsed['Priority'] || 'Normal'}</span>
                          {parsed['Done'] && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddPropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-popover border p-5 rounded-2xl w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-sm font-semibold">Add New Database Column</h3>
            <form onSubmit={handleAddPropertySubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Column Name</label>
                <input
                  type="text"
                  required
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  placeholder="e.g. Priority, Assignee, Due Date"
                  className="w-full bg-muted/60 p-2 text-xs rounded-lg border mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Column Type</label>
                <select
                  value={newPropType}
                  onChange={(e) => setNewPropType(e.target.value)}
                  className="w-full bg-muted/60 p-2 text-xs rounded-lg border mt-1"
                >
                  <option value="TEXT">Text</option>
                  <option value="SELECT">Select Dropdown</option>
                  <option value="CHECKBOX">Checkbox</option>
                  <option value="DATE">Date</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPropModal(false)}
                  className="px-3 py-1.5 text-xs rounded-lg hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90"
                >
                  Add Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Row Side Peek Drawer */}
      <RowPeekDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
        properties={properties}
        onUpdateRow={handleUpdateRow}
        onDeleteRow={handleDeleteRow}
      />
    </div>
  );
}
