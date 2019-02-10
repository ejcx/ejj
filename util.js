let head = `<!DOCTYPE html><html><head>
<title>E</title>
<style>
  body {
    max-width:650px;
    margin: 2em auto 4em;
    padding: 0 1rem;
    line-height: 1.5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    -webkit-font-smoothing: antialiased;
  }
  img {
    max-width: 450px;
    display: block;
    text-align: center;
    margin: 0 auto;
  }
  ul {
    list-style:none;
    padding-left:0;
  }
  li.spacer {
    padding-top:15px;
  }
</style>
</head><body>
<div class="categories"><a href="/">About</a> | <a href="/blog">Blog</a> | <a href="/contact">Contact</a></div>
`

let foot = `
</body></html>
`

async function get(key) {
  try {
    var v = await kv.fetch(key, {headers: {"cache-control": "no-cache"}})
    return await v.text()
  } catch (e) {
    return null
  }
}

// put a key in storage.
async function put(key, value) {
  return await kv.put(key, value);
}

function render(f) {
  return head + f + foot
}

module.exports = {
  render:render,
  put:put,
  get:get
}
