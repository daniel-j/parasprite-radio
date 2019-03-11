![Parasprite Radio](https://i.imgbox.com/GARLVsXm.png)

Under development! See the live site: http://radio.djazz.se

## Installation

Note: Installation instructions are not complete!

### Install dependencies

#### Ubuntu

TODO

#### Arch Linux

`sudo pacman -S nodejs npm mariadb mpd icecast mediainfo graphicsmagick flac opus-tools curl festival sox`

Now [install Liquidsoap](https://www.liquidsoap.info/) from [AUR](https://aur.archlinux.org/packages/liquidsoap/) or [OPAM](https://opam.ocaml.org/packages/liquidsoap/).

Install [ffmpeg-git](https://aur.archlinux.org/packages/ffmpeg-git/) from AUR or build it yourself. Any recent ffmpeg version with fdkaac enabled should work. You could also install the [ffmpeg-full](https://aur.archlinux.org/packages/ffmpeg-full/) or [ffmpeg-full-git](https://aur.archlinux.org/packages/ffmpeg-full-git/) package, or possibly [ffmpeg-libfdk_aac](https://aur.archlinux.org/packages/ffmpeg-libfdk_aac/).

Follow [these instructions](https://wiki.archlinux.org/index.php/MySQL#Installation) to set up the MySQL service.

### Set up
```
# Install Gulp globally:
sudo npm install -g gulp

# Install nodejs dependencies and build the app in debug mode:
./install

# Create structure for MPD:
mkdir -p ~/.mpd/playlists
touch ~/.mpd/playlists/radio.m3u
```

Edit `/etc/icecast.xml` and increase `<sources>` from 2 to 10. Also, change passwords! Create a MySQL database for the radio. Edit `conf/radio.toml` and `conf/mpd.conf`. Start Icecast and MySQL services.

## Usage

Start MPD: `bin/startmpd`

Start Liquidsoap: in development `bin/startliq dev` or production `bin/startliq`

Start node server: in development `bin/startserver -d` or production `bin/startserver`

If you haven't changed the default port, you can view the radio page here: [http://localhost:8002](http://localhost:8002)

For debugging with BrowserSync, run `gulp watch`, `bin/startserver -d` and open [http://localhost:3000](http://localhost:3000)

To build the app for production: `gulp -p`
