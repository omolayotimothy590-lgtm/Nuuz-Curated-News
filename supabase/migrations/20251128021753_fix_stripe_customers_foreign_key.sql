/*
  # Fix stripe_customers foreign key to use custom users table

  1. Changes
    - Drop foreign key constraint pointing to auth.users (to allow update)
    - Update existing stripe_customers records to use public.users IDs
    - Add new foreign key constraint pointing to public.users
    - This allows the edge function to create customer records for custom auth users

  2. Security
    - Maintains referential integrity with correct users table
    - Preserves existing subscription data by matching emails
*/

-- Drop the old foreign key constraint pointing to auth.users FIRST
ALTER TABLE stripe_customers 
DROP CONSTRAINT IF EXISTS stripe_customers_user_id_fkey;

-- Update stripe_customers to use public.users IDs by matching emails
UPDATE stripe_customers sc
SET user_id = pu.id
FROM auth.users au
JOIN public.users pu ON au.email = pu.email
WHERE sc.user_id = au.id;

-- Add new foreign key constraint pointing to public.users
ALTER TABLE stripe_customers
ADD CONSTRAINT stripe_customers_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id)
ON DELETE CASCADE;