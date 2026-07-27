"use client";

import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  Search,
  Filter,
  Layers,
  Kanban,
  GanttChart,
  Grid2X2,
  Users,
  AlertCircle,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskDetailDrawer } from '@/components/tasks/task-detail-drawer';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'gantt' | 'calendar' | 'matrix' | 'workload'>('kanban');
  const [search, setSearch] = useState('');

  // Selected task drawer state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Work');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newEstHours, setNewEstHours] = useState('2.0');

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          priority: newPriority,
          estimatedHours: newEstHours,
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setShowAddModal(false);
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleComplete = async (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCompleted = !task.completed;
    if (nextCompleted) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }

    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          completed: nextCompleted,
          status: nextCompleted ? 'Done' : 'To Do',
        }),
      });
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statuses = ['To Do', 'In Progress', 'In Review', 'Done'];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Advanced Task Tracker System</h1>
            <p className="text-xs text-muted-foreground">Multi-dimensional views, time & cost tracking, dependencies, and automation</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition shadow-sm text-xs"
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Multi-Dimensional View Mode Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              viewMode === 'kanban' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" /> Kanban Board
          </button>
          <button
            onClick={() => setViewMode('gantt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              viewMode === 'gantt' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GanttChart className="w-3.5 h-3.5" /> Gantt Timeline
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              viewMode === 'calendar' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Calendar
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              viewMode === 'matrix' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid2X2 className="w-3.5 h-3.5" /> Eisenhower Matrix
          </button>
          <button
            onClick={() => setViewMode('workload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              viewMode === 'workload' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Workload & Capacity
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks or metadata..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted/60 pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-4 gap-4">
          {statuses.map((status) => {
            const statusTasks = filteredTasks.filter((t) => (t.status || 'To Do') === status);
            return (
              <div key={status} className="bg-muted/40 p-4 rounded-2xl border space-y-3 flex flex-col min-h-96">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-xs font-bold uppercase tracking-wider">{status}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-background font-mono font-bold border">
                    {statusTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {statusTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="bg-card border p-4 rounded-xl shadow-2xs hover:shadow-md cursor-pointer transition space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold leading-tight group-hover:text-primary transition">{task.title}</span>
                        <button onClick={(e) => handleToggleComplete(task, e)}>
                          {task.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </div>

                      {/* Tags & Time Variance */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                        <span className="px-2 py-0.5 rounded bg-muted font-medium">{task.category}</span>
                        <div className="flex items-center gap-1 font-mono font-medium">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span>{task.actualHours}/{task.estimatedHours}h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: GANTT TIMELINE VIEW */}
      {viewMode === 'gantt' && (
        <div className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <GanttChart className="w-4 h-4 text-primary" /> Interactive Critical Path Gantt Timeline
            </h3>
            <span className="text-xs text-muted-foreground">Dependencies & Overruns highlighted</span>
          </div>

          <div className="space-y-3 divide-y">
            {filteredTasks.map((task, idx) => (
              <div key={task.id} className="pt-3 flex items-center gap-4 text-xs">
                <div className="w-48 font-semibold truncate cursor-pointer hover:text-primary" onClick={() => setSelectedTaskId(task.id)}>
                  {task.title}
                </div>
                <div className="flex-1 bg-muted/40 h-8 rounded-lg relative overflow-hidden flex items-center px-2">
                  <div
                    className={`h-6 rounded-md px-3 flex items-center text-[10px] font-bold text-white shadow-xs transition-all ${
                      task.priority === 'High' ? 'bg-red-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(20, (task.estimatedHours || 1) * 15))}%` }}
                  >
                    {task.actualHours > 0 ? `${task.actualHours}h logged` : `${task.estimatedHours}h est`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-3">
            <CalendarIcon className="w-4 h-4 text-primary" /> Monthly Deadline Calendar
          </h3>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-2 border-b">{day}</div>
            ))}
            {Array.from({ length: 28 }).map((_, idx) => (
              <div key={idx} className="h-24 bg-muted/20 border rounded-xl p-2 text-left space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground">{idx + 1}</span>
                {idx === 14 && (
                  <div className="bg-primary/20 text-primary p-1 rounded text-[10px] font-bold truncate">
                    Project Launch
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: EISENHOWER MATRIX VIEW */}
      {viewMode === 'matrix' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Quadrant 1: Do First (Urgent & Important)
            </h3>
            <div className="space-y-2">
              {filteredTasks.filter((t) => t.isUrgent && t.isImportant).map((t) => (
                <div key={t.id} onClick={() => setSelectedTaskId(t.id)} className="bg-card border p-3 rounded-xl cursor-pointer text-xs font-semibold">
                  {t.title}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/30 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Quadrant 2: Schedule (Important, Not Urgent)
            </h3>
            <div className="space-y-2">
              {filteredTasks.filter((t) => !t.isUrgent && t.isImportant).map((t) => (
                <div key={t.id} onClick={() => setSelectedTaskId(t.id)} className="bg-card border p-3 rounded-xl cursor-pointer text-xs font-semibold">
                  {t.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: WORKLOAD VIEW */}
      {viewMode === 'workload' && (
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-3">
            <Users className="w-4 h-4 text-emerald-500" /> Team Bandwidth & Capacity Heatmap
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-6 h-6 rounded-full" alt="User" />
                <span>Demo User (40h/week capacity)</span>
              </div>
              <span className="text-emerald-600 font-bold">18h assigned (45% capacity)</span>
            </div>
            <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[45%]" />
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-popover border p-6 rounded-2xl w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-bold">Create New Task Entry</h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Design API Specifications"
                  className="w-full bg-muted/60 p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-muted/60 p-2.5 rounded-lg border"
                  >
                    <option value="Work">Work</option>
                    <option value="Health">Health</option>
                    <option value="Learning">Learning</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-muted/60 p-2.5 rounded-lg border"
                  >
                    <option value="Critical">Critical 🚨</option>
                    <option value="High">High 🔴</option>
                    <option value="Medium">Medium 🟡</option>
                    <option value="Low">Low 🟢</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Estimated Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={newEstHours}
                  onChange={(e) => setNewEstHours(e.target.value)}
                  className="w-full bg-muted/60 p-2.5 rounded-lg border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg hover:bg-muted font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Side Drawer */}
      <TaskDetailDrawer
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        allTasks={tasks}
        onRefresh={fetchTasks}
      />
    </div>
  );
}
