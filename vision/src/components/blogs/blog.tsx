import React from "react";


/**
 * FIXME:  Add a redux property where we can pull data from mongodb for blog posts and add the
 * HTML string as a property
 */
export class BlogPost extends React.Component {
	render() {
		return (
			<div>
				<article className="media">
					<figure className="media-left">
						<p className="image is-64x64">
							<img src="https://bulma.io/images/placeholders/128x128.png" />
						</p>
					</figure>
					<div className="media-content">
						<div className="content">
							<p>
								<strong>Sean Toner  </strong>
								<small>placeoftheway@gmail.com  </small>
								<small>02-13-2020 20:21 UTC-6</small>
								<h1 className="title">It's alive!!</h1>
								<p>
							  I finally got at least something up and running on Google Cloud using the kubernetes engine (GKE).  I noticed that the webcam isn't working like it does on my local dev environment, so I need to figure out what's going on there.
								</p>

								<p>
								Nevertheless, I'm pretty stoked.  This project has a <strong>long</strong> way to go.  But as a proof of concept and a learning vehicle, it's been pretty fun so far.  I've been wanting to get better at a couple of things and it's finally starting to fall into place.  Having the free time to do this has definitely helped.  Also, just focusing on two languages has also been a big help.  I'm going to stick with typescript and rust for the foreseeable future.
								</p>

								<h2 className="subtitle">Where from here?</h2>
								<p>
								I'm a little bit torn on what to work on next.  One part of me is chomping at the bit to do some Deep Learning tensorflow.  Now that I am able (at least in my local dev environment) to get webcam data, I want to start making use of it.  My first task will be for facial recognition (of specific people) and then for object tracking.
								</p>

								<p>
								The other thing I could work on is the actual chat interface.  I was originally thinking I was going to do some NLP.  In fact, the original genesis of this project was from working with Slack.
								</p>

								<p>
								The problem I observed was that people often didn't report problems through Jira.  Instead, they would chat with someone on our team and ask if we were having some kind of issues, or if they had seen some problem before.  A related problem was that sometimes in some other Slack channel, a problem that people were talking about was affecting our own work.  What if there was a way to:

								<ul>
									<li>See if the gist of the conversation was something we had seen before?</li>
									<li>Monitor other channels to see if conversations were related to what we did</li>
									<li>Find anomalies from snippets users were posting (ie, logs)</li>
								</ul>
								</p>

								<p>
								So, there's a part of me that wants to work on that too.  However, I think I am going to work on the webcam and visual data as more of a priority.  The main reason for this is that I believe it will take less work.  The chat interface is actually going to require quite a bit more infrastructure.
								</p>

								<p>
								For example, I will need to send websocket messages as events that the browser will receive to know when new users connect, and old ones disconnect.  I also need to store the data in mongodb.  I also wanted this to be more slack like rather than a chat app.  In other words, it's like a real-time mini-blog system where you can post data, make links, and edit or delete your messages.
								</p>

								<p>This is still something I want to work on because it will get me better at mongodb, and also it will lay groundwork for the blog system.  And that means that yes, I'm going to move my blog to here instead of my <a href ="http://rarebreed.github.io/">old one</a></p>

                <h2 className="subtitle">Why no Openshift</h2>
								<p>Sadly, I wasted about a week trying to figure out how to use Openshift.  Being an ex-Red Hatter, I really wanted to be able to use it.  But there simply wasn't enough documentation on how to go about doing it.  I literally got the GKE project up in about 2 days.  That was with me being brand new to GCP and GKE.  And that was figuring out how to use kubectl and minikube as well for dev purposes</p>

								<h2 className="subtitle">Thoughts on kubernetes</h2>
								<p>I've never actually fully understood docker.  Not so much the technical part of it, I mean, but rather why it's so popular.  Don't get me wrong, I think it does make a lot of things easier.  Being able to quickly spin up a container is often easier than making sure you've got everything your app needs to run</p>

								<p>
								That being said, once you get past singe container apps, things start getting hairy.And how many apps don't need to rely on other services?  Even before microservices were the rage, you had your LAMP or MEAN stack.  While using docker-compose helps, now you start getting into the weeds of docker networking.	
								</p>

								<p>
								To be honest, I was quite amazed I got the GKE app running as fast as I did.  The deployment yaml files are yet another maze of config details to learn.  And I haven't even gotten into the Ingress object type.  I sort of cheated too and used the kompose tool to convert my docker-compose file into my deployment and service config files.  I also haven't looked too hard at how their load balancer works, though it looks like they have both a low-level TCP/UDP load balancer, as well as an application (http traffic) balancer.
								</p>
							</p>
						</div>
						<nav className="level is-mobile">
							<div className="level-left">
								<a className="level-item">
									<span className="icon is-small"><i className="fas fa-reply"></i></span>
								</a>
								<a className="level-item">
									<span className="icon is-small"><i className="fas fa-retweet"></i></span>
								</a>
								<a className="level-item">
									<span className="icon is-small"><i className="fas fa-heart"></i></span>
								</a>
							</div>
						</nav>
					</div>
					<div className="media-right">
						<button className="delete"></button>
					</div>
				</article>
			</div>
		)
	}
}