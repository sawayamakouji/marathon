/*
  # Training Records Schema

  1. New Tables
    - `training_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `distance` (numeric)
      - `duration` (text)
      - `pace` (text)
      - `location` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `training_records` table
    - Add policies for authenticated users to:
      - Read their own records
      - Create new records
      - Update their own records
      - Delete their own records
*/

CREATE TABLE IF NOT EXISTS training_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  distance numeric NOT NULL,
  duration text NOT NULL,
  pace text NOT NULL,
  location text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own records
CREATE POLICY "Users can read own records"
  ON training_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own records
CREATE POLICY "Users can insert own records"
  ON training_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own records
CREATE POLICY "Users can update own records"
  ON training_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own records
CREATE POLICY "Users can delete own records"
  ON training_records
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);