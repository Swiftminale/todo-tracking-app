-- ==========================================
-- PulseTask - Notion-Style PostgreSQL Schema (With Recycle Bin)
-- Copy & Paste this into your Supabase SQL Editor:
-- https://app.supabase.com/project/yickimqwaqdwxpmvbomj/sql/new
-- ==========================================

-- 1. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Work',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'to_do', -- 'to_do', 'in_progress', 'done'
  due_date DATE DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  starred BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  estimated_minutes INT DEFAULT 30,
  actual_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Subtasks Table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Health',
  target_days_per_week INT DEFAULT 5,
  streak INT DEFAULT 0,
  icon TEXT DEFAULT 'activity',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Habit History Table
CREATE TABLE IF NOT EXISTS public.habit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_habit_check UNIQUE (habit_id, check_date)
);

-- 5. Create Focus Logs Table
CREATE TABLE IF NOT EXISTS public.focus_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  duration_minutes INT NOT NULL,
  task_title TEXT DEFAULT 'Deep Focus',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Quick Notes Table
CREATE TABLE IF NOT EXISTS public.user_notes (
  id INT PRIMARY KEY DEFAULT 1,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Public Access Policies
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on tasks" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Allow public all on subtasks" ON public.subtasks FOR ALL USING (true);
CREATE POLICY "Allow public all on habits" ON public.habits FOR ALL USING (true);
CREATE POLICY "Allow public all on habit_history" ON public.habit_history FOR ALL USING (true);
CREATE POLICY "Allow public all on focus_logs" ON public.focus_logs FOR ALL USING (true);
CREATE POLICY "Allow public all on user_notes" ON public.user_notes FOR ALL USING (true);
