/**
 * Holds blog
 */

import React from "react";
import { useSelector } from "react-redux";

import { State } from "../state/store";

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
  const user = useSelector((state: State) => {
    return state.connectState.username
  });

  // TODO: Make a request to the database if we are active
  if (props.active) {
    console.log("TODO: get blogs from this user from db");
  }

  return (
    <div className="blog-posts">
      <h1>Welcome to khadga!</h1>
      <p>
        This is an in-progress tool for collaboration and communication between any kind of agent.  An agent could be a human user, or it could be some kind of IoT device.  This is the author's little pet project to do some hands on work in several technologies.
      </p>
      <p>
        There are 3 main features:
        <ul>
          <li>Chat</li>
          <li>Video Chat</li>
          <li>Blogs</li>
        </ul>
        <br />
      </p>
      <h2>Using the site</h2>
      <p>
        To use the site, in the menu, there are a couple of options.  Most of the features require that you have a Google account and authenticate via Google.  In the future, I'll have the means to register with the site (if you don\'t want Google tracking you).
      </p>
      <h2>Plans for khadga</h2>
      <p>
        One of my goals of this project is as a playground to learn about different technologies, primarily web front and backend programming, graphql, IoT embedded programming, kubernetes, and tensorflow.  As such, I will be moving my blog posts here.  Eventually, other users will be able to post blogs here as well.
      </p>
    </div>
  )
}