-- Add 'pending' status to user_tasks table
-- First, drop the existing check constraint
ALTER TABLE user_tasks DROP CONSTRAINT IF EXISTS user_tasks_status_check;

-- Add the new constraint with 'pending' status
ALTER TABLE user_tasks ADD CONSTRAINT user_tasks_status_check 
  CHECK (status IN ('active', 'pending', 'completed', 'cancelled'));

-- Create task_notes table for logging task updates and sub-descriptions
CREATE TABLE IF NOT EXISTS task_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES user_tasks(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on task_id for faster queries
CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON task_notes(task_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_task_notes_created_at ON task_notes(created_at DESC);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_task_notes_updated_at
    BEFORE UPDATE ON task_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Users can manage task notes"
    ON task_notes
    FOR ALL
    USING (true)
    WITH CHECK (true);

