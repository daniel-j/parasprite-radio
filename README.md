Parasprite Radio
===

Under development! See the live site: http://radio.djazz.se

Installation
---

Note: Installation instructions are not complete!

The app uses Twitter authentication, so you have to [set up an app key](https://apps.twitter.com/).

### Arch Linux
`sudo pacman -S nodejs npm mariadb mpd icecast mediainfo ffmpeg`

Follow [these instructions](https://wiki.archlinux.org/index.php/MySQL#Installation) to set up the MySQL service.

(optional) For text-to-speech support:
`sudo pacman -S festival sox`

Now [install Liquidsoap](http://liquidsoap.fm/download.html) from [AUR](https://aur.archlinux.org/packages/liquidsoap/) or [OPAM](https://opam.ocaml.org/packages/liquidsoap/).


### Set up
```
# Install Gulp globally:
sudo npm install -g gulp

# Install nodejs dependencies and build the app in debug mode:
./install

# Create structure for MPD:
mkdir -p ~/.mpd/playlists
touch ~/.mpd/playlists/radio

# Edit /etc/icecast.xml and increase <sources> from 2 to 10. Also, change passwords!
# Create a MySQL database for the radio
# Edit config.toml and mpd.conf
# Start Icecast and MySQL services
```

Start MPD: `./startmpd`

Start Liquidsoap: in development `./startliq dev` or production `./startliq`

You can start the web server with `./radio`

To build the app for production: `./build-release`

To run the web server in development: `./radio -d`

If you haven't changed the default port, you can view the radio page here: [http://localhost:8002](http://localhost:8002)

For debugging with BrowserSync, run `gulp watch`, `./radio -d` and open [http://localhost:3000](http://localhost:3000)

