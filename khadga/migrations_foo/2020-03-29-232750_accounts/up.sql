CREATE TABLE accounts (
  account_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  account_type CHAR(20),
  created_on TIMESTAMP NOT NULL,
  active BOOLEAN NOT NULL DEFAULT 'f',
  CHECK (account_type in ('free', 'premium_annual', 'premium_monthly')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
)