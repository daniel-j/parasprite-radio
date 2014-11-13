Parasprite Radio
===

Under development! See live demo here: http://radiodev.djazz.se

Chat with me: http://djazz.se/chat.php

Installation
---

First setup Redis, MySQL and MPD servers. The app uses Twitter authentication, so you have to [set up that too](https://apps.twitter.com/). Then you can install the node dependencies: `./install`

Now edit config.json and start the app with `./radio`

**For developers:**
Install Grunt and Bower globally: `# npm install -g grunt-cli bower`

Install the app in developer mode: `./install -d`

You can then start the node server with `./radio -d` and grunt's watch mode with `app/edit-debug`

To build the app for deployment/release (for example when pushing to git): `app/build-release`