/*
 * The users table simply identifies a user
 */
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL
)

CREATE TABLE posts (
  post_id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL,
  title VARCHAR NOT NULL,
  body TEXT NOT NULL,
  created_on TIMESTAMP NOT NULL,
  published BOOLEAN NOT NULL DEFAULT 'f',
  FOREIGN KEY (author_id) REFERENCES users(user_id)
)

/* Comments can either be on posts, or on other comments, which is why 
 * they have 3 foreign keys.
 */
CREATE TABLE comments (
  comment_id SERIAL PRIMARY KEY,
  body TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  ref_post_id INTEGER NOT NULL,
  created_on TIMESTAMP NOT NULL,
  ref_comment_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (ref_post_id) REFERENCES posts(post_id),
  FOREIGN KEY (ref_comment_id) REFERENCES comments(comment_id)
)

CREATE TABLE accounts (
  account_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  account_type CHAR(20),
  created_on TIMESTAMP NOT NULL,
  active BOOLEAN NOT NULL DEFAULT 'f',
  CHECK (account_type in ('free', 'premium_annual', 'premium_monthly')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
)

CREATE TABLE uploads (
  upload_id SERIAL PRIMARY KEY,
  last_upload_date TIMESTAMP NOT NULL,
  file_name VARCHAR NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
)