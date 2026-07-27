"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Timer as TimerIcon, Play, Pause, RotateCcw, CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const MODES = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export default function TimerPage() {
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work);
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [focusLogs, setFocusLogs] = useState<any[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchFocusLogs();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.filter((t: any) => !t.completed));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFocusLogs = async () => {
    try {
      const res = await fetch('/api/timer');
      if (res.ok) {
        const data = await res.json();
        setFocusLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            logFocusSession();
            return MODES[mode];
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const logFocusSession = async () => {
    const duration = Math.round(MODES[mode] / 60);
    const selectedTask = tasks.find((t) => t.id === selectedTaskId);
    const taskTitle = selectedTask ? selectedTask.title : 'Deep Focus Session';

    try {
      await fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: duration, taskTitle }),
      });
      fetchFocusLogs();
    } catch (e) {
      console.error(e);
    }
  };

  const switchMode = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode]);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODES[mode]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-5">
        <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
          <TimerIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Focus Timer</h1>
          <p className="text-xs text-muted-foreground">Pomodoro focus timer with deep work sessions and break intervals</p>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="bg-card border rounded-3xl p-10 shadow-lg text-center space-y-8 max-w-xl mx-auto">
        {/* Modes Bar */}
        <div className="inline-flex bg-muted p-1.5 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => switchMode('work')}
            className={`px-4 py-2 rounded-xl transition ${
              mode === 'work' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Deep Focus (25m)
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`px-4 py-2 rounded-xl transition ${
              mode === 'shortBreak' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Short Break (5m)
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`px-4 py-2 rounded-xl transition ${
              mode === 'longBreak' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Large Counter */}
        <div className="text-7xl font-extrabold font-mono tracking-tight text-foreground py-4">
          {formatTime(timeLeft)}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition shadow-md text-sm"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> Start Focus
              </>
            )}
          </button>

          <button
            onClick={resetTimer}
            className="flex items-center gap-2 px-5 py-3 border font-semibold rounded-2xl hover:bg-muted transition text-sm text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        {/* Task Target Selector */}
        <div className="pt-4 border-t text-left">
          <label className="text-xs font-semibold text-muted-foreground block mb-2">Focusing on Task:</label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-muted/60 border px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            <option value="">-- General Unscheduled Focus --</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.estimatedMinutes} mins)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Focus History Logs */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Recent Completed Focus Logs
        </h3>

        {focusLogs.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">No focus sessions logged yet today.</div>
        ) : (
          <div className="divide-y text-xs">
            {focusLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-foreground">{log.taskTitle}</span>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    +{log.durationMinutes} mins
                  </span>
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
