/*
  # Create AI Conversations Table

  1. New Tables
    - `ai_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `article_id` (uuid, foreign key to articles)
      - `question` (text)
      - `answer` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `ai_conversations` table
    - Add policy for users to read their own conversations
    - Add policy for users to create their own conversations
    - Add policy for users to delete their own conversations

  3. Indexes
    - Add index on (user_id, article_id) for fast conversation retrieval
    - Add index on created_at for chronological ordering
*/

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Users can read their own conversations
CREATE POLICY "Users can read own conversations"
  ON ai_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users can create own conversations"
  ON ai_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON ai_conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_article 
  ON ai_conversations(user_id, article_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at 
  ON ai_conversations(created_at DESC);