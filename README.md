# About

[**Beoprevoz**][1] is a Firefox OS app (this means it is essentially a webapp) 
that provides you with data on public transport lines, stations, vehicles, 
routes etc. within Belgrade. It was created originally for a local 
Serbian-Montenegrin competition called [Telenor Firefox Challenge] [2], 
where it won the first prize (see [here] [3]<sup>1</sup>). 
However, its architecture allows effortless integration of brand new 
datasets, and it is by no means tightly coupled to Belgrade itself. There 
might be quite a few bugs, but I have not time to fix them. I am 
open-sourcing this code just because I hope someone someday will find it 
useful, expand it to their own city, improve it or just use some piece of it 
in their own software.

[1]: https://marketplace.firefox.com/app/beoprevoz
[2]: http://www.telenor.rs/en/About-Telenor/Media-Centre/Press-release/Telenor-s-Firefox-Challenge-for-best-app-for-Firefox-OS/?pn=4
[3]: http://www.telenor.rs/en/About-Telenor/Media-Centre/Press-release/Telenor-awarded-5000-euros-for-the-best-application-at-the-competition-Firefox-challenge/?pn=1

It's been tested on Geeksphone Peak and reported working fine on Geeksphone 
Keon. I've since tried pitching an Android/WP port to official developers of 
the current Android app for Belgrade's public transport (which sports a number 
of one-star reviews and complaints that it's not working) but it's been 
declined. I'll maybe do it when I have some more free time, though.

<sup>1</sup>: It says there Goran Davidovic received the prize. That's my 
father's name because I was 16 at the time and not eligible to be team leader.

# Features

Features that require Internet access:

  * **Google Maps** integration for viewing public transport data on a map 
    (lines, stations, user-defined points)
  * **Google Places Search** integration so you can find streets, shops or 
    other points of interest and perform queries based on their location
  * Maps integrated with the geolocation API for quick "my location" 
    pinpointing within the app
    
Features that do not require Internet access:

  * Complete searchable data on around 2600 public transport stations and 
    around 200 transport lines in Belgrade, stored offline for fast access
  * A fast routing algorithm that performs entirely on your device and takes 
    into account various parameters, such as waiting time for a particular 
    vehicle, their average velocities, amount of time they spend waiting on 
    stations, etc. If you have Internet access, you can ask for a route from 
    arbitrary point A to arbitrary point B, otherwise, you can route between 
    individual public transport stations
  * Integration with the geolocation API which allows you to view stations and 
    lines that are nearest to you, alongside their approximate distances
  * One-tap check of nearby vehicle positions via city's public USSD code 
    interface
  * A zoomable, stylized and concise map of the public transport system that 
    serves as a quick reference on what lines go where and what the network 
    looks like
  * Localized to both Serbian and English
    
There is also a short introduction, shown the first time when you open the 
app, that guides you through some main tasks to ensure a pleasant experience.

# Screenshots

![Intro screen][screens/intro-en.png]
Beoprevoz greets you with a friendly introduction screen

![Main menu][screens/menu-en.png]
The main menu of the app, offering some common choices

![Map screen][screens/map-en.png]
The map screen, showing a GPS-pinpointed location

![Nearest stops][screens/network-en.png]
Geolocation-enabled list of nearest stops and their current distances

![Directions][screens/directions-en.png]
A view of the output of the routing algorithm

# The repository

## Source organization 

There are four main directories: app/, art/, screens/ and scripts/.

The actual code, alongside image assets and third-party libraries, is in the 
app/ directory. There are app/styles/, containing CSS (my files are only 
app/styles/main.css and app/styles/util.css, the rest are (mostly) Firefox OS 
building blocks), app/js, containg my JS code and third-party libraries under 
app/js/lib, app/data, with automatically-generated JSON area data and 
app/index.html, the main HTML file where the magic starts.

art/ contains PSD files for icons, backgrounds etc. Might come in handy if 
customization later on is desired.

screens/ contain some screenshots of the app in action.

scripts/ contain scripts/main/ and scripts/routing/.

Inside scripts/main/ there are scripts related to building the belgrade.json 
and belgrade-index.json files by crawling the public website and churning 
that data up.

Inside scripts/routing/ are scripts (and a small C program that can classify 
as a script) that build the routing graph from the aforementioned JSON files 
and pack it up in base64-encoded binary files that are, hopefully, efficient 
for JavaScript to load. The graph comes out to around 2600 nodes and around 
60.000 edges, if I remember correctly. 

All the scripts are in PHP, with a couple of sh one-liners to avoid excessive 
typing. I don't quite remember how to use these scripts anymore, but their 
meaning can be inferred quite easily if one takes a closer look.

## Libraries

Third-party libraries used:
  * **Fastclick** (fixes double click delay issue)
  * **Leaflet** (displays the local zoomable tracemap)
  * **Hammer** (detects touchscreen gestures)
  * Some third-party code, such as for a natural comparison function.

It's rather interesting to note that I haven't used jQuery or any similar 
framework. It was because I thought it'd be fun to code everything from 
scratch, and I was damn right.

# How is this useful to you?

As I said, I'm open-sourcing this because I love giving to the community, but 
I don't think it can serve a lot of purposes. If you can crawl the names and 
geolocations of your city's public transport stations, alongside the line 
specifications, you can easily swap everything out and just with a few changes 
customize Beoprevoz entirely for your own city.

It contains some interesting pieces of code, for instance a humble in-app 
navigation system that Firefox OS natively lacks and an implementation of 
Dijkstra's algorithm with a binary heap and JavaScript's typed arrays. Also, 
if you're starting a new Firefox OS app, it may be useful to look into how 
Beoprevoz achieves some JavaScript or CSS common tasks.

# Known issues

I've gone to great lengths to make this app as useful and bug-free as 
possible, but as the deadline for submission approached, I wasn't able to 
quite satisfy my standards. Unfortunately, I can't currently go bug-hunting, 
so there are some things to keep in mind:

  * I've never tested what happens if you navigate the map outside Belgrade 
    and ask the app to do something from there. I doubt it would create a 
    serious problem, but it looks ugly. The routing algorithm might really 
    sweat there, as well.
  * Some transport lines are cyclic, but the layer that translates the routing 
    subsystem's output to human-readable text does not account for this. As 
    such, I imagine it spitting out negative station distances, for example, but 
    it would be fairly easy, if not trivial, to fix.
  * The scripts that generate JSON data used in the app (within the scripts/ 
    directory) might have some mistakes, or I might have forgotten to add some 
    of them. If you spot something like this, please drop me a line.
  * I recall there being a crazy bug where a station didn't match when you 
    typed its full ID. I don't remember the details, but the workaround is easy, 
    and I reckon it is easy to fix, too.
  * Something screwed up Google Maps popups so some stations have their buttons 
    overflow. It looks pretty nasty, and I have no idea what caused it.
  * Source code might and does include a lot of swearing because I was quite 
    pissed a lot of times during development. English language swearing 
    actually means I was just mildly annoyed, but if you encounter Serbian swear 
    words, it's a sign that something serious had gone awry at the time.
  * Most likely I've forgotten to include here something important.
  
There are some things that could've been done way better, but I simply didn't 
have the time/didn't know how to do them:

  * IndexedDB could have been used here instead of the ugly JSON files with 
    great success.
  * The routing algorithm was not benchmarked. As such, I'm maybe running 
    behind with performance because of premature optimization that took place.
  * HTML, CSS and Javascript are a bit too messy for my taste. They started 
    out real beautiful, but as the deadline was approaching, more and more 
    kludges came to be, and I never caught the time to fix them.
  * Not cross-browser compatible. It's technically a Firefox OS app, but it 
    should be runnable on all browsers. However, most of the stuff is 
    compatible, it's just some CSS trickery that's causing discrepancies in the 
    presentation.
  * I am a crappy artist, so I can imagine design people cringing at the sight 
    of my UX :)
  * Probably more.
  
# License

Released under the 2-clause BSD license, check the LICENSE file.
