ZONEID=019ca3dea8a8cef4cb35b1f3bafcff09
ORGID=51a194e0a18776642ce8563cdaf9d3bd
NAMESPACEID=e4d8f4f8e55245a6b4cce6778f561b17
ZONENAME=ejj.io

yarn:
	yarn

upload-statics:
	cf worker write-kv --organization-id $(ORGID) --namespace-id $(NAMESPACEID) --key static/index.md --value @static/index.md
	cf worker write-kv --organization-id $(ORGID) --namespace-id $(NAMESPACEID) --key static/contact.md --value @static/contact.md
	cf worker write-kv --organization-id $(ORGID) --namespace-id $(NAMESPACEID) --key static/misconfigured-cors.html --value @static/misconfigured-cors.html
	cf worker write-kv --organization-id $(ORGID) --namespace-id $(NAMESPACEID) --key static/crashing-safari.html --value @static/crashing-safari.html
	cf worker write-kv --organization-id $(ORGID) --namespace-id $(NAMESPACEID) --key static/keybase-io-vulnerability.html --value @static/keybase-io-vulnerability.html
	cf worker write-kv --organization-id $(ORGID) --namespace-id $(NAMESPACEID) --key static/blog.md --value @static/blog.md
	cf worker write-kv --organization-id $(ORGID) --namespace-id $(NAMESPACEID) --key static/cloudflare-all-the-way-down.md --value @static/cloudflare-all-the-way-down.md
	cf worker write-kv --organization-id $(ORGID) --namespace-id $(NAMESPACEID) --key static/newsletter.md --value @static/newsletter.md

build:
	./node_modules/webpack-cli/bin/cli.js app.js

deploy-app-prod:
	cf worker upload-worker --script @dist/main.js --zone-id $(ZONEID)

deploy-app-stage:
	cf worker upload-organization-worker --script @dist/main.js --organization-id $(ORGID) --name ejj-io-stage

list-keys:
	cf worker list-kvs --organization-id $(ORGID) --namespace-id $(NAMESPACEID)

all: yarn build deploy-app-stage

all-prod: yarn build deploy-app-prod
