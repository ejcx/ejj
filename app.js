var workerrouter = new require('workerrouter')
var app = new workerrouter();
var util = require('./util.js')
var marked = require('marked')

let get = util.get || null;
let put = util.put || null;
let render = util.render

function serve(f) {
  return async (request) => {
    let page = render(marked(await get(f)))
    return new Response(page, {
      headers: {
        'Content-Type':'text/html'
      }
    })
  }
}

function serve_raw(f) {
  return async (request) => {
    let page = render(await get(f))
    return new Response(page, {
      headers: {
        'Content-Type':'text/html'
      }
    })
  }
}

async function random_fit(request) {
  let shirts = Math.floor(Math.random() * 8)+1
  let shorts = Math.floor(Math.random() * 4)+1
  return new Response(render(`<img src='/fit/shirt${shirts}.jpg'/><img src='/fit/short${shorts}.jpg'/>`), {
    headers: {
      'Content-Type':'text/html'
    }
  })
}

async function serve_fit(request) {
  let garmet = await fits.get(request.params.fitid)
  if (garmet === null) {
    return new Response("401", { status: 401})
  }
  const headers = new Headers()
  garmet.writeHttpMetadata(headers)
  headers.set('etag', garmet.httpEtag)
  const status = garmet.body ? 200 : 304
  return new Response(garmet.body, {
    headers,
    status
  })
}

// New blog posts. Stricter Routing.
app.get("^\/randomfit$", random_fit);
app.get("^\/fit\/(?<fitid>(short|shirt)[0-9]+.jpg)$", serve_fit);
app.get('/blog\/cloudflare-all-the-way-down', serve('static/cloudflare-all-the-way-down.md'));
app.get('/blog\/flying-software', serve('static/flying-software.md'));
app.get('/blog\/capital-one', serve('static/capital-one.md'));
app.get('/blog\/fixing-capital-one', serve('static/fixing-capital-one.md'));
app.get('\/blog\/passgo-update', serve('static/passgo.md'));
app.get('\/blog\/cloud-duct-tape', serve('static/cloud-duct-tape.md'));

// Note that blog is optional. These are hyperlinked to a long time ago, and
// blog was historically not prefixed on the path. Going forward don't forget
// to prefix blog.
app.get('\/(blog\/)?misconfigured-cors', serve_raw('static/misconfigured-cors.html'));
app.get('\/(blog\/)?crash-safari-com', serve_raw('static/crashing-safari.html'));
app.get('\/(blog\/)?keybase-io-vulnerability', serve_raw('static/keybase-io-vulnerability.html'));

app.get('^\/blog(\/)?', serve('static/blog.md'));
app.get('/contact$', serve('static/contact.md'));
app.get('/newsletter$', serve('static/newsletter.md'));
app.get('^\/(index.html)?$', serve('static/index.md'));

addEventListener('fetch', event => {
  event.respondWith(app.listen(event));
})
