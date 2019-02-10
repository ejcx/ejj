# It's Cloudflare All The Way Down
I rewrite my personal website every few years. It's a chance to learn the hot new technology of the time period, and to revamp the design with one I like more.

In 2012, ejj.io was a few PHP files served with Apache, fronted by Cloudflare. I then rewrote it to be Golang fronted by Cloudflare in 2015.

I attempted to rewrite it a few times, and ended up [rewriting it in Express](https://github.com/ejcx/site) in July of 2018.

Today, [ejj.io is written and delivered](https://github.com/ejcx/ejj) completely with Cloudflare Workers. **I realized while rebuilding my site that Cloudflare is now my website's entire stack**, not just the way the content is delivered.

# The Site
The source code for this site is [available on github](https://github.com/ejcx/ejj). 

The site's routing is handled using [Worker Router](https://github.com/ejcx/workerrouter). It's a simple express-like (this is very generous) router I whipped up to do routing in workers.

Here's an example:
```
var workerrouter = new require('workerrouter')
var app = new workerrouter();

app.post('^/hello/(?<greet>[a-zA-Z]+)', async function(request) {
  return new Response('Hello ' + request.params.greet);
})
```
The deployment of my site is handled with [cf](https://github.com/ejcx/cf). It's a simple Cloudflare CLI that I use to upload my static files, deploy my worker, and whatever else I need to do.

<img src="https://camo.githubusercontent.com/b50f1d6159c3105ccf13a9426a6e38bc17d8f267/68747470733a2f2f692e696d6775722e636f6d2f4a7335727743432e676966" title="cf demo"/>

# Storage
I wrote this blog post as markdown, which is read from Workers KV, converted to HTML, and served. You might notice I have some non-markdown blog posts as well. These are legacy posts that I hand wrote in HTML, and didn't want to spend the time converting to markdown.

I use `cf` to write static files to the storage namespace that I set up for my blog.

<img src="https://i.imgur.com/wBLhHB0.png"/>

# A Staging Site
I've never rolled out a staging site for my personal blog before, but it was really simple to do with Workers 'Routes' feature.

<img src="https://i.imgur.com/WCBSJZQ.png"/>

I deploy my staging site at staging.ejj.io instead of ejj.io. It's deployed as a separate worker script, and each worker script has a separate make target.


# TLS
It's not a website without a secure connection. Instead of worrying about TLS myself, this site uses a Cloudflare Dedicated Certificate.

<img src="https://i.imgur.com/lyOJPoF.png"/>

I use dedicated certificates because I am an employee at Cloudflare and wanted to try them out, but Universal SSL for free would work just as well.

# DNS
For the most part, all domains on Cloudflare must use Cloudflare's DNS. ejj.io is not an exception, and my nameservers point at `carter.ns.cloudflare.com` and `donna.ns.cloudflare.com`.

<img src="https://i.imgur.com/LIVsYHm.png"/>

Cloudflare handles advertising my website's DNS records around the globe with ANYCAST.

# Registrar.
My domain is registered with Cloudflare Registrar. It's nice to not worry about paying for WHOIS protection as a US resident. Cloudflare automatically redacts my personal information.

<img src="https://i.imgur.com/sUWERVN.png"/>

Note the "DATA REDACTED" in some of the whois results.

Cloudflare is doing so much for  my website that domain registration is hard to fit on the screen.

<img src="https://i.imgur.com/7EqCLju.png"/>

# Takeaway
It's interesting now that Workers and Registrar exist, I can now use Cloudflare for every part of my website and stop paying DigitalOcean and managing a server.

The entire rewrite of my site using Workers took only about an hour of work to do from scratch. One of the requirements was that it would be easier to write blog posts as markdown, so hopefully I am able to write more often.

Feb 10, 2019
