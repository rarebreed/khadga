/**
 * Holds blog
 */

import React from "react";
import { useDispatch, useSelector } from "react-redux";

interface BlogProps {
  active: boolean;
}

/**
 * Container for blog posts
 * 
 * When the Tab for blogs is active, it will make a request for this logged in user and do a couple
 * of things:
 * 
 * - Retrieve a (paginated) list of this user's blogs
 * - Check the database for any other users that the logged in user is following
 * 
 * As the user scrolls and hits the paginated limit, another database request will be made to get
 * additional posts.  Also, we will only show a subset of the blog and allow the user to expand to
 * show more content
 * 
 * @param props 
 */
export const Blog: React.FC<BlogProps> = (props) => {
  // TODO: Make a request to the database if we are active

  return (
    <div className="blog-posts">
      Nothing to see here, move along!
    </div>
  )
}