"use client";

import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Clock,
  DollarSign,
  Plus,
  CheckCircle2,
  Circle,
  MessageSquare,
  History,
  AlertTriangle,
  Tag,
  Calendar,
  User,
  Sparkles,
  Trash2,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
  allTasks?: any[];
  onRefresh: () => void;
}

export function TaskDetailDrawer({
  isOpen,
  onClose,
  taskId,
  allTasks = [],
  onRefresh,
}: TaskDetailDrawerProps) {
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'audit'>('details');

  const fetchTask = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) fetchTask();
  }, [isOpen, taskId]);

  if (!isOpen || !taskId) return null;

  const handleUpdate = async (updates: any) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, ...updates }),
      });
      if (res.ok) {
        fetchTask();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTimer = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/timer`, { method: 'POST' });
      if (res.ok) {
        fetchTask();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSubtaskTitle.trim(),
          parentTaskId: taskId,
          category: task?.category || 'Work',
        }),
      });
      setNewSubtaskTitle('');
      fetchTask();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      setNewComment('');
      fetchTask();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAISubtasks = async () => {
    if (!task) return;
    const suggestions = [
      `Research requirement specs for ${task.title}`,
      `Draft initial implementation design`,
      `Conduct review & test validation`,
    ];

    for (const sub of suggestions) {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sub,
          parentTaskId: taskId,
          category: task.category,
        }),
      });
    }
    fetchTask();
    onRefresh();
  };

  const subtasks = task?.subtasks || [];
  const completedSubtasks = subtasks.filter((s: any) => s.completed).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const totalCost = task ? (task.actualHours * task.hourlyRate).toFixed(2) : '0.00';
  const hoursOverrun = task ? (task.actualHours - task.estimatedHours).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-popover border-l text-popover-foreground w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted">
              {task?.category || 'Task'}
            </span>
            <select
              value={task?.status || 'To Do'}
              onChange={(e) => handleUpdate({ status: e.target.value })}
              className="bg-background border px-3 py-1 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleTimer}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                task?.isTimerRunning
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              {task?.isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{task?.isTimerRunning ? 'Stop Timer' : 'Start Timer'}</span>
            </button>

            <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b px-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'details'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Task Overview & Subtasks
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'comments'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments ({task?.comments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Title & Description */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={task?.title || ''}
                  onChange={(e) => setTask({ ...task, title: e.target.value })}
                  onBlur={() => handleUpdate({ title: task?.title })}
                  className="text-2xl font-bold bg-transparent w-full focus:outline-none placeholder:text-muted-foreground"
                  placeholder="Task title"
                />
                <textarea
                  value={task?.description || ''}
                  onChange={(e) => setTask({ ...task, description: e.target.value })}
                  onBlur={() => handleUpdate({ description: task?.description })}
                  placeholder="Add detailed task specification or notes..."
                  className="w-full bg-muted/30 p-3 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-primary min-h-24 resize-none"
                />
              </div>

              {/* Eisenhower Matrix & Property Controls */}
              <div className="grid grid-cols-2 gap-4 bg-card border p-4 rounded-xl text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Priority Level</label>
                  <select
                    value={task?.priority || 'Medium'}
                    onChange={(e) => handleUpdate({ priority: e.target.value })}
                    className="w-full bg-background border px-2.5 py-1.5 rounded-lg font-medium"
                  >
                    <option value="Critical">Critical 🚨</option>
                    <option value="High">High 🔴</option>
                    <option value="Medium">Medium 🟡</option>
                    <option value="Low">Low 🟢</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Assignee</label>
                  <div className="flex items-center gap-2 bg-background border px-2.5 py-1 rounded-lg">
                    <img src={task?.assigneeAvatar} className="w-4 h-4 rounded-full" alt="Avatar" />
                    <span className="font-medium truncate">{task?.assignee}</span>
                  </div>
                </div>

                {/* Eisenhower Matrix Controls */}
                <div className="col-span-2 flex items-center justify-between border-t pt-3">
                  <span className="font-semibold text-muted-foreground">Eisenhower Classification:</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={!!task?.isUrgent}
                        onChange={(e) => handleUpdate({ isUrgent: e.target.checked })}
                        className="w-3.5 h-3.5 accent-red-500 rounded"
                      />
                      <span>Urgent ⚡</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={!!task?.isImportant}
                        onChange={(e) => handleUpdate({ isImportant: e.target.checked })}
                        className="w-3.5 h-3.5 accent-indigo-500 rounded"
                      />
                      <span>Important ⭐</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Time & Financial Cost Bar */}
              <div className="bg-muted/40 border p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>Time & Cost Analytics</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <DollarSign className="w-4 h-4" /> ${totalCost} Billable
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="bg-background p-2 rounded-lg border">
                    <span className="text-muted-foreground text-[10px] block">Est. Hours</span>
                    <span className="font-bold">{task?.estimatedHours || 1}h</span>
                  </div>
                  <div className="bg-background p-2 rounded-lg border">
                    <span className="text-muted-foreground text-[10px] block">Actual Logged</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{task?.actualHours || 0}h</span>
                  </div>
                  <div className="bg-background p-2 rounded-lg border">
                    <span className="text-muted-foreground text-[10px] block">Variance</span>
                    <span className={`font-bold ${parseFloat(hoursOverrun) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {parseFloat(hoursOverrun) > 0 ? `+${hoursOverrun}h` : `${hoursOverrun}h`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subtasks Hierarchy & Checklist */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold">Nested Subtasks ({completedSubtasks}/{subtasks.length})</span>
                  </div>
                  <button
                    onClick={handleAISubtasks}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold hover:bg-indigo-500/20 transition"
                  >
                    <Sparkles className="w-3 h-3" /> Auto AI Subtasks
                  </button>
                </div>

                {/* Progress bar */}
                {subtasks.length > 0 && (
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${subtaskProgress}%` }} />
                  </div>
                )}

                <div className="space-y-1.5">
                  {subtasks.map((st: any) => (
                    <div key={st.id} className="flex items-center justify-between p-2 rounded-lg bg-card border text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            await fetch('/api/tasks', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: st.id, completed: !st.completed }),
                            });
                            fetchTask();
                          }}
                        >
                          {st.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        <span className={st.completed ? 'line-through text-muted-foreground' : 'font-medium'}>{st.title}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Form */}
                <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a new subtask..."
                    className="flex-1 bg-muted/50 border px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg">
                    Add
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment or update..."
                  className="w-full bg-muted/40 p-3 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary min-h-20"
                />
                <button type="submit" className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg">
                  Post Comment
                </button>
              </form>

              <div className="space-y-3 border-t pt-4">
                {task?.comments?.map((c: any) => (
                  <div key={c.id} className="p-3 bg-card border rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{c.authorName}</span>
                      <span>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-foreground">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Trail Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              {task?.auditLogs?.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-card border rounded-xl text-xs">
                  <History className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground">{log.action}</div>
                    <p className="text-muted-foreground">{log.details}</p>
                    <span className="text-[10px] text-muted-foreground/60">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
