Parasprite Radio
===

Under development! See the live site: http://radio.djazz.se

Installation
---

Installations instructions are not complete!

Setup Redis, MySQL and MPD servers. The app uses Twitter authentication, so you have to [set up that too](https://apps.twitter.com/).

Now edit config.toml and then start the app with `./radio`

**For developers:**

Install Gulp globally: `# npm install -g gulp`

Install the dependencies and build the app: `./install`

You can then start the server with `./radio -d` and gulp's watch mode with `gulp watch`

To build the app for deployment/release: `./build-release`

To run the server in production: `./radio`
