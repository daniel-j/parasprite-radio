Parasprite Radio
===

Under development! See live demo here: http://radiodev.djazz.se


Installation
---

First setup Redis and MySQL servers. The app uses Twitter authentication, so you have to [set up that too](https://apps.twitter.com/).
Then you can install the node dependencies: `$ ./install`
Now edit config.json and start the app with `$ ./radio`

**For developers:**
Install Grunt and Bower globally: `# npm install -g grunt-cli bower`
Install PR in developer mode: `$ ./install -d`
You can then start the node server with `$ ./radio -d` and grunt's watch mode with `$ app/edit-debug`