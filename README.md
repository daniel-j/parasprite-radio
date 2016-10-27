Parasprite Radio
===

Under development! See the live site: http://radio.djazz.se

Installation
---

Note: Installations instructions are not complete!

Setup Icecast, MySQL and MPD servers. The app uses Twitter authentication, so you have to [set up that too](https://apps.twitter.com/). You also need Liquidsoap.

```
# Install Gulp globally:
npm install -g gulp # (run as root if required)

# Install nodejs dependencies and build the app in debug mode:
./install
```

Now edit config.toml with correct details for MySQL, Icecast, MPD, Twitter, Google...

You can start the web server with `./radio -d` and gulp's watch mode with `gulp watch`

To build the app for deployment/release: `./build-release`

To run the server in production: `./radio`

When running on default port, view the radio page here: [http://localhost:8002](http://localhost:8002)

For debugging with BrowserSync, run `gulp watch`, `./radio -d` and open [http://localhost:3000](http://localhost:3000)
