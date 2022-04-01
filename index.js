const {ProxyChecker, downloadAllProxies} = require('free-proxy-checker');
const path = require('path');
const { writeFile } = require('fs/promises');

(async () => {
    const allProxies = await downloadAllProxies();

    const proxyChecker = new ProxyChecker(allProxies, {
        concurrency: 100,
        timeout: 7500,
        verbose: true
    })

    await proxyChecker.checkProxies();
    //const proxiesUp = proxyChecker.getProxiesUp();

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
                <p class="subtitle">Updated: ${Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'long' }).format(Date.now())}</p>
                <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>IP</th>
                            <th>Port</th>
                            <th>Up</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allProxies.sort((a, b) => b.isUp - a.isUp || a.host.localeCompare(b.host)).map(proxy => `
                        <tr>
                            <td>${proxy.constructor.name.replace('Proxy', '').toUpperCase()}</td>
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
})();
