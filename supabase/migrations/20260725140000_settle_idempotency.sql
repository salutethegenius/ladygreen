-- One successful settlement transaction per payment link (idempotency).
-- Concurrent webhooks that race past the app-level check will fail uniquely.
create unique index if not exists idx_transactions_one_success_per_link
  on transactions (link_id)
  where status = 'successful' and link_id is not null;
