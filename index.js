const { ProxyChecker, downloadAllProxies } = require('free-proxy-checker')
const path = require('path')
const maxmind = require('maxmind')
const { writeFile } = require('fs/promises')
const { countryCodeEmoji } = require('country-code-emoji');

(async () => {
  // Download all proxies
  const allProxies = (await downloadAllProxies())
  // And filter duplicate values
    .filter((value, index, self) => index === self.findIndex((t) => (t.host === value.host && t.port === value.port)))

  // Check which proxies are up
  const proxyChecker = new ProxyChecker(allProxies, {
    concurrency: 100,
    timeout: 7500,
    verbose: true
  })
  await proxyChecker.checkProxies()

  // Enrich with country info
  const geolite2 = await import('geolite2-redist')
  const reader = await geolite2.open('GeoLite2-Country', (dbPath) => maxmind.open(dbPath))
  allProxies.map(proxy => {
    const lookup = reader.get(proxy.host)
    if (lookup) {
      proxy.country = countryCodeEmoji(lookup.country.iso_code) + ' ' + lookup.country.names.en
    } else {
      proxy.country = '--'
    }
    return proxy
  })

  // Write to HTML file
  await writeFile(path.join(__dirname, 'build', 'index.html'), `
<!DOCTYPE html>
<html>
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Free Proxy List</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0/css/bulma.min.css">
  </head>
  <body>
    <section class="section">
      <div class="container">
        <h1 class="title">Free Proxy List</h1>
        <div class="field is-grouped is-grouped-multiline is-pulled-right">
          <div class="control">
            <div class="tags has-addons">
              <span class="tag">Proxies (all)</span>
              <span class="tag is-info">${allProxies.length}</span>
            </div>
          </div>

          <div class="control">
            <div class="tags has-addons">
              <span class="tag">Proxies (up)</span>
              <span class="tag is-success">${proxyChecker.getProxiesUp().length}</span>
            </div>
          </div>
        </div>
        <p class="subtitle"><strong>Updated</strong>: ${Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'long' }).format(Date.now())}</p>
        <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
          <thead>
            <tr>
              <th>Type</th>
              <th>Country</th>
              <th>IP</th>
              <th>Port</th>
              <th>Up</th>
            </tr>
          </thead>
          <tbody>
            ${allProxies.sort((a, b) => b.isUp - a.isUp || a.host.localeCompare(b.host)).map(proxy => `
            <tr>
              <td>${proxy.constructor.name.replace('Proxy', '').toUpperCase()}</td>
              <td>${proxy.country}</td>
              <td>${proxy.host}</td>
              <td>${proxy.port}</td>
              <td>${proxy.isUp ? '✅' : '❌'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  </body>
  <footer class="footer">
      <div class="content has-text-centered">
          <p>
              <strong>Free Proxy List</strong> - see <a href="https://github.com/Niek/free-proxy-list">GitHub</a> for source code.
          </p>
      </div>
  </footer>
</html>
    `, 'utf8')

  reader.close()
})()
