## Rationale

Why am I building this?  While working at my last job and using Slack, I noticed a recurring
problem.  Very often, users would mention problems or ask questions in a Slack channel rather than
post an issue in Jira.  I wondered if there was a way to monitor a Slack channel to answer a couple
of questions:

- From chat talk, could we identify a problem before it blew up?
- Could we detect that questions were similar to other questions (with answers)?
- Could we find trends or anomalies (ie, were people always talking about certain subjects?)?

Furthermore, what if we could extrapolate this out from informal speech in chats to issues buried
inside Jira, Bugzilla, etc.  The same could be done with log analysis.  The difference is that it
would be nice to do this analysis in real time as opposed to data mining.

The second issue was that my work involved trying to qualify image quality.  For example, let's say
that a video should have subtitles.  It would be nice to detect that yes, there were subtitles and
that they were correct.  Although I am no longer involved in that work, image recognition is a
rapidly evolving (and desirable) skillset.

The first part of deep learning is getting data to train on.  The next to last part of deep learning
is to get data to test on.  This tool is an experiment to do both.

## Roadmap

As mentioned above, getting data is key to deep learning.  We need data, and the more the better.
So the first phase of the project is to set up a tool that will allow us to get data, both in
textual format and video from a webcam.  Once we have data, we can actually start building models
and training them.  So we will have 3 phases:

1. Create a tool to make people want to use it
2. Work on the NLP and computer vision deep learning
3. Add more polish, security and data collection features

### Initial Target Audience

While this is a hobby project, I'd like to make it polished enough and secure enough, so that it
could be used in an enterprise setting.  For this first iteration though, it needs to be polished
enough to provide a hobbyist level of sophistication..  In fact, my first target audience to use the
tool will be as a Table Top RPG helper.

Gamers could use this tool to do video chats and send text in chats.  Other features that will
eventually be included are:

- Ability to upload blog posts
- Ability to do live collaboration documentation (think etherpad or google docs)

### Deep Learning

Once we have a Minimal Viable Product, we can start crunching on the data.  This is when work on
tensorflow will begin in earnest.  There might be some new data collecting going on simultaneously,
but the main emphasis will be on answering those questions posed in the Rationale.

### Enterprise level

Once we have some promising deep learning insights, the User Interface will be polished, and tighter
security will be done.  