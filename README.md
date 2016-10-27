Parasprite Radio
===

Under development! See the live site: http://radio.djazz.se

Installation
---

Installations instructions are not complete!

Setup Icecast, MySQL and MPD servers. The app uses Twitter authentication, so you have to [set up that too](https://apps.twitter.com/). You also need Liquidsoap.

**For developers:**

Install Gulp globally: `# npm install -g gulp`

Install the dependencies and build the app: `./install`

Now edit config.toml with correct authentication details for MySQL, Icecast, MPD, Twitter, Google etc..

You can then start the server with `./radio -d` and gulp's watch mode with `gulp watch`

To build the app for deployment/release: `./build-release`

To run the server in production: `./radio`

When running on default port, view the radio page here: [http://localhost:8002](http://localhost:8002)
