-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
    id BIGSERIAL PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_email) REFERENCES auth.users(email) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_history_project_user ON chat_history(project_id, user_email);
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp);

-- Add RLS policies
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Policy for inserting messages
CREATE POLICY "Users can insert their own messages"
ON chat_history FOR INSERT
TO authenticated
WITH CHECK (auth.email() = user_email);

-- Policy for reading messages
CREATE POLICY "Users can read their own messages"
ON chat_history FOR SELECT
TO authenticated
USING (auth.email() = user_email);

-- Policy for deleting messages
CREATE POLICY "Users can delete their own messages"
ON chat_history FOR DELETE
TO authenticated
USING (auth.email() = user_email); 