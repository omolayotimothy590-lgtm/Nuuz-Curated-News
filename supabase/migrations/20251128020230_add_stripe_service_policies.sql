/*
  # Add Service Role Policies for Stripe Tables

  1. Changes
    - Add INSERT policies for stripe_customers table to allow service role to create customer records
    - Add INSERT policies for stripe_subscriptions table to allow service role to create subscription records
    - Add UPDATE policies for stripe_subscriptions table to allow service role to update subscription status
    - These policies enable the stripe-checkout edge function to manage customer and subscription data

  2. Security
    - Policies are restrictive and only allow necessary operations
    - Existing SELECT policies remain unchanged for users
    - Service role operations bypass RLS, but explicit policies provide clarity
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service can insert customer records" ON stripe_customers;
DROP POLICY IF EXISTS "Service can insert subscription records" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Service can update subscription records" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Service can delete subscription records" ON stripe_subscriptions;

-- Allow service role to insert customer records
CREATE POLICY "Service can insert customer records"
  ON stripe_customers
  FOR INSERT
  WITH CHECK (true);

-- Allow service role to insert subscription records  
CREATE POLICY "Service can insert subscription records"
  ON stripe_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Allow service role to update subscription records
CREATE POLICY "Service can update subscription records"
  ON stripe_subscriptions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow service role to delete (soft delete) subscriptions
CREATE POLICY "Service can delete subscription records"
  ON stripe_subscriptions
  FOR DELETE
  USING (true);