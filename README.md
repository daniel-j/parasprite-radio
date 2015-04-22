Parasprite Radio
===

Under development! See live demo here: http://radiodev.djazz.se

Chat with me: http://radio.djazz.se

Installation
---

Installations instructions may not work!

Setup Redis, MySQL and MPD servers. The app uses Twitter authentication, so you have to [set up that too](https://apps.twitter.com/).

Now edit config.json and then start the app with `./radio`

**For developers:**

Install Grunt and Bower globally: `# npm install -g grunt-cli bower`

Install the dependencies and build the app: `./install`

You can then start the server with `./radio -d` and grunt's watch mode with `app/edit-debug`

To build the app for deployment/release: `app/build-release`

To run the server in production: `./radio`