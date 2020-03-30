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