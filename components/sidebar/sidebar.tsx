"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  Trash2,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  Flame,
  Timer,
  BarChart3,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { DocumentItem } from './document-item';
import { SearchModal } from '@/components/modals/search-modal';
import { TrashModal } from '@/components/modals/trash-modal';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [rootDocuments, setRootDocuments] = useState<any[]>([]);
  const [tasksCount, setTasksCount] = useState(0);
  const [habitsCount, setHabitsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const fetchSidebarData = async () => {
    try {
      const [docsRes, tasksRes, habitsRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/tasks'),
        fetch('/api/habits'),
      ]);

      if (docsRes.ok) {
        const docs = await docsRes.json();
        setRootDocuments(docs);
      }
      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        setTasksCount(tasks.filter((t: any) => !t.completed).length);
      }
      if (habitsRes.ok) {
        const habits = await habitsRes.json();
        setHabitsCount(habits.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebarData();

    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('open-search-modal', handleOpenSearch);
    return () => window.removeEventListener('open-search-modal', handleOpenSearch);
  }, []);

  const handleCreateRootPage = async () => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Page',
          icon: '📄',
        }),
      });
      if (res.ok) {
        const newDoc = await res.json();
        fetchSidebarData();
        router.push(`/documents/${newDoc.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <aside
        className={cn(
          "group/sidebar relative h-full bg-secondary/50 border-r flex flex-col transition-all duration-300 z-30 select-none",
          isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-64 opacity-100"
        )}
      >
        {/* Workspace Box */}
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              N
            </div>
            <span className="truncate">Personal Workspace</span>
          </div>

          <button
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Bar */}
        <div className="p-2 border-b space-y-0.5">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search Pages</span>
            </div>
            <kbd className="text-[10px] px-1 py-0.2 bg-background border rounded font-mono">⌘K</kbd>
          </button>

          <button
            onClick={handleCreateRootPage}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>New Page</span>
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* DATABASES SECTION (Requested by User) */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
              DATABASES
            </div>

            <button
              onClick={() => router.push('/tasks')}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition",
                pathname === '/tasks'
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                <span>Tasks Database</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground/70">{tasksCount}</span>
            </button>

            <button
              onClick={() => router.push('/habits')}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition",
                pathname === '/habits'
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-orange-500/80" />
                <span>Habit Tracker</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground/70">{habitsCount}</span>
            </button>

            <button
              onClick={() => router.push('/timer')}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition",
                pathname === '/timer'
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Timer className="w-4 h-4 text-indigo-500/80" />
                <span>Focus Timer</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/analytics')}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition",
                pathname === '/analytics'
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-emerald-500/80" />
                <span>Insights & Metrics</span>
              </div>
            </button>
          </div>

          {/* DOCUMENTS TREE SECTION */}
          <div className="space-y-1 pt-2 border-t">
            <div className="px-2 py-1 flex items-center justify-between text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
              <span>DOCUMENTS</span>
              <button
                onClick={handleCreateRootPage}
                title="Add Page"
                className="p-0.5 hover:text-foreground transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4 text-xs text-muted-foreground">Loading workspace...</div>
            ) : rootDocuments.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">No documents found</div>
            ) : (
              rootDocuments.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  level={0}
                  onRefresh={fetchSidebarData}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-2 border-t space-y-0.5 bg-background/50">
          <button
            onClick={() => setIsTrashOpen(true)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Trash</span>
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Re-open Sidebar Button when collapsed */}
      {isCollapsed && (
        <button
          onClick={onToggleCollapse}
          title="Open Sidebar"
          className="fixed left-3 top-3 z-40 p-2 rounded-lg bg-popover border shadow-md hover:bg-muted text-muted-foreground hover:text-foreground transition animate-in fade-in"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} onRefreshSidebar={fetchSidebarData} />
    </>
  );
}
