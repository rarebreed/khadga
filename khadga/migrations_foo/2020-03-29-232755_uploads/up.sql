CREATE TABLE uploads (
  upload_id SERIAL PRIMARY KEY,
  last_upload_date TIMESTAMP NOT NULL,
  file_name VARCHAR NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
)