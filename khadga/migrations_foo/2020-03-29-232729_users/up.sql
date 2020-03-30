/*
 * The users table simply identifies a user
 */
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL
)
