CREATE TABLE posts (
  post_id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL,
  title VARCHAR NOT NULL,
  body TEXT NOT NULL,
  created_on TIMESTAMP NOT NULL,
  published BOOLEAN NOT NULL DEFAULT 'f',
  FOREIGN KEY (author_id) REFERENCES users(user_id)
)