/*
  # Fix Subscription View Performance
  
  1. Changes
    - Drop and recreate the stripe_user_subscriptions view
    - Fix the WHERE clause to properly handle NULL subscriptions
    - This allows the view to return quickly even when no subscription exists
  
  2. Improvements
    - Remove the problematic `s.deleted_at IS NULL` check that was filtering out NULL subscriptions
    - Keep only the customer deleted_at check
*/

DROP VIEW IF EXISTS stripe_user_subscriptions;

CREATE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id AND s.deleted_at IS NULL
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL;

GRANT SELECT ON stripe_user_subscriptions TO authenticated;
