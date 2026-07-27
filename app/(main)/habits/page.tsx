"use client";

import React, { useState, useEffect } from 'react';
import { Flame, Plus, Check, Trash2, Calendar, Target, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Health');
  const [newTarget, setNewTarget] = useState('7');

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      if (res.ok) {
        const data = await res.json();
        setHabits(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // Compute last 7 days
  const today = new Date();
  const days: { dateStr: string; dayLabel: string; dayNumber: number; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: d.toISOString().split('T')[0],
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: i === 0,
    });
  }

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          category: newCategory,
          targetDaysPerWeek: newTarget,
        }),
      });

      if (res.ok) {
        setNewName('');
        setShowAddModal(false);
        fetchHabits();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCheck = async (habitId: string, dateStr: string, currentChecked: boolean) => {
    const nextChecked = !currentChecked;
    if (nextChecked) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }

    try {
      await fetch('/api/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: habitId,
          dateStr,
          toggleCheck: nextChecked,
        }),
      });
      fetchHabits();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await fetch('/api/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDeleted: true }),
      });
      fetchHabits();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
            <Flame className="w-6 h-6 fill-orange-500/20" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Habit Tracker</h1>
            <p className="text-xs text-muted-foreground">Build daily consistency, track streaks, and form positive habits</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition shadow-sm text-xs"
        >
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      {/* Habits Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-muted-foreground">Loading habits...</div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16 border rounded-2xl bg-card">
          <Flame className="w-10 h-10 mx-auto text-orange-500/30 mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">No active habits</p>
          <p className="text-xs text-muted-foreground/70">Create daily habits to track your streaks!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => {
            const historyMap = habit.history ? JSON.parse(habit.history) : {};

            return (
              <div key={habit.id} className="bg-card border p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{habit.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {habit.category} • Target: {habit.targetDaysPerWeek}x/week
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 rounded-full text-xs font-bold shadow-xs">
                      <Flame className="w-4 h-4 fill-orange-500" />
                      <span>{habit.streak} day streak</span>
                    </div>

                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-muted rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 7 Day Checklist */}
                <div className="grid grid-cols-7 gap-2 pt-2 border-t">
                  {days.map((day) => {
                    const isChecked = !!historyMap[day.dateStr];

                    return (
                      <button
                        key={day.dateStr}
                        onClick={() => handleToggleCheck(habit.id, day.dateStr, isChecked)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition ${
                          isChecked
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                            : 'bg-muted/30 hover:bg-muted border-border text-foreground'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            day.isToday ? (isChecked ? 'text-white' : 'text-primary') : 'text-muted-foreground'
                          }`}
                        >
                          {day.dayLabel}
                        </span>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isChecked ? 'bg-white/20' : 'bg-background border'
                          }`}
                        >
                          {isChecked ? <Check className="w-4 h-4 stroke-[3]" /> : day.dayNumber}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-popover border p-6 rounded-2xl w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-bold">Create New Habit</h3>
            <form onSubmit={handleCreateHabit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Habit Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Daily Reading (30 mins)"
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
                    <option value="Health">Health</option>
                    <option value="Learning">Learning</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Mindfulness">Mindfulness</option>
                    <option value="Fitness">Fitness</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Target Days/Week</label>
                  <select
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full bg-muted/60 p-2.5 rounded-lg border"
                  >
                    <option value="7">Everyday (7x)</option>
                    <option value="5">Weekdays (5x)</option>
                    <option value="3">3 Days a Week</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 shadow-sm"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
