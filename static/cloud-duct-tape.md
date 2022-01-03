# Cloud Duct Tape - New life for my NVR with Cloudflare
I bought a house this year and was surprised to find the previous owners left behind an on-prem NVR, along with 6 PoE cameras. This stuff was a few years old and so it didn't have cloud support. Even if it did have cloud support, and just needed my payment details, I wasn't really comfortable giving up control of cameras in my house.

I decided to deal with what I had, which wasn't so bad. It was pretty expensive equipment just a few years ago and I learned that it had a lot of advanced features, like motion detection, email notifications, etc once I got it working. I wanted to be able to use it like a smart home camera system, but one that I had full control over.

I set out to turn my dumb camera into a smart camera, with only some cloud duct tape. As I was working on this I started thinking about just how much “legacy” stuff that exists, which just needs a little “cloud duct tape” to be great again. There's nothing wrong with what I had. The only thing missing were a few connectivity and security features that consumers have grown to expect. I ended up building those features with a little bit of duct tape powered by Cloudflare, and in the process saved thousands of dollars by avoiding replacing the cameras.

## Setting up the system
I started by booting up the box, connecting to it, and using the default password to get access to the platform. The appliance I had available was a ClareControls 8-Channel NVR with 2TB of storage.

<img src="https://i.imgur.com/CdLpQfi.png"/>

To get access to it, I had to search a bit to find [the manual](https://cdn2.hubspot.net/hubfs/2972898/Tech%20Pubs/Product%20Information%20/Archived/Surveillance%20/CV-B8810-02%20ClareVision%20Network%20Video%20Recorder%20Installation%20Guide%20(DOC%20ID%20345).pdf). I found the default login and password for the device had never been changed when it was installed for the previous owners. The username is clareadmin and password is secure7. Score! Hacking is easy. I was able to log in and I could see the device supported RTSP, had automatic recording on movement, alerting / recording time windows, and a lot of advanced home security features.

After some debugging I was able to get the box running and watch the camera feed over rtsp from my apple TV and apple devices without much effort. Neat! Here are some images at night that are hard to see but show it works!

<img src="https://i.imgur.com/x0eZw2M.png"/>

The actual configuration was simple, and just required me to figure out what cameras were connected to which paths and channels. Here's the configuration for my front door camera that I set up on my iPhone.

<img src="https://i.imgur.com/pJKPA7W.png"/>

## Remote Connectivity
That would be plenty if I was always at home (which, to be fair, I mostly have been). I wanted to be able to see what my cameras could see when I wasn't near them. I couldn't connect over RTSP from the outside world without poking a giant hole in my home network, which I was not comfortable with.

I didn't need to see a live video feed, my security system will automatically record on movement and other neat things. I just want to be able to check on things every now and then, see if I have a package on my porch, and make sure nothing is amiss. Additionally, I didn't need long term storage. The hardware itself has that. 

I wrote a short [go program](https://github.com/ejcx/miniwatch/blob/main/miniwatch.go) that uses ffmpeg to get a single frame from the rtsp server every few seconds. It takes each of those jpegs and uploads them to a Cloudflare Worker KV namespace. In the future if I'd like to record short videos, or add any new features, I can easily change what ffmpeg is doing.

<img src="https://i.imgur.com/fL8YNrB.png"/>

A wise man (Albert Strasheim) once told me. Any time I want to write a bash script, I should write it as a go program that shells out to bash and the result will be 100x better. Maybe he told me that because I was no good at writing Bash, but the advice stuck with me. This go program is running on a rapsberry pi in my networking closet, and it starts on boot with systemd.

To see the images, I wrote a tiny Cloudflare Worker that loads a small webpage and reads the images out of the KV namespace. No frills. Just images with recent images from my cameras at home.

<img src="https://i.imgur.com/TySCRhh.png"/>

And in my browser with Safari it's pretty easy to load up and have a look at what's going on:

<img src="https://i.imgur.com/mWgdMcB.png"/>

## Remote Management

Besides seeing a sample of what's going on, I also wanted to be able to log into the appliance, configure it, save a video, review a recording, all remotely. To do this I needed to be able to proxy to the appliance which runs a web server on port 80 instead of have something connect to rtsp



This was fairly straightforward with Cloudflare Tunnels and Cloudflared running on the rapsberry pi. I didn't innovate here. Just copied [this tutorial from the cloudflared docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide)


## Security and Access Control
All of this stuff is sensitive. At least to me it is. I don't want internet strangers to be able to see images from these cameras, or worse be able to configure the management console. Or worse, get access to the management console, find a 0day in the appliance, and use it to pivot into my home network! 

I put these websites behind Cloudflare Access and authenticate my family with our email addresses. The Cloudflare Access identity aware proxy integrating with Cloudflare Workers and Tunnels is one of my favorite features.

<img src="https://i.imgur.com/nNJlRGb.png"/>



And that's it! We've completely duct taped together something pretty comparable to your best smart cloud connected cameras. We have access to a live feed, a live sampling, and management of the devices!

## Prior Art

There is a lot of prior art in this space. Two things I was particularly influenced by:

- Mohak Kataria, A very similar pet cam blog — https://blog.cloudflare.com/building-a-pet-cam-using-a-raspberry-pi-cloudflare-tunnels-and-teams/
- Brad Fitzpatrick, very amusing lightning talk — https://www.youtube.com/watch?v=4yFb-b5GYWc


## Thoughts

I think so many companies set out to build something new. I think there's a lot of opportunity and good in the world making utilities that make old things new again. Too many companies are remaking perfectly good things, charging a subscription, and introducing new problems that they don't know how to solve. Or making products that are leaving "legacy" tech behind

I toyed with a few different designs for, but once I committed and found the energy, this took just a single morning to accomplish. The duct tape route ended up being the easiest, cheapest, and fully comprehensive solution. Next time you need some technology to solve a problem at your house or at work, reach for the duct tape.

Jan 2, 2022
