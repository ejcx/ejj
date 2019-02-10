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

// Note that blog is optional. These are hyperlinked to a long time ago, and
// blog was historically not prefixed on the path. Going forward don't forget
// to prefix blog.
app.get('\/(blog\/)?misconfigured-cors', serve_raw('static/misconfigured-cors.html'));
app.get('\/(blog\/)?crash-safari-com', serve_raw('static/crashing-safari.html'));
app.get('\/(blog\/)?keybase-io-vulnerability', serve_raw('static/keybase-io-vulnerability.html'));
app.get('/staging', async (request) => { return new Response("It's staging") })

app.get('/blog', serve('static/blog.md'));
app.get('/contact$', serve('static/contact.md'));
app.get('^\/(index.html)?$', serve('static/index.md'));

addEventListener('fetch', event => {
  event.respondWith(app.listen(event));
})
