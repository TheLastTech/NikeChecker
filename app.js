let got = require('got');
let Webhook = require("webhook-discord")
let Hook = new Webhook("**your webhook url here**")
let tunnel = require('tunnel-agent');
let FileSystem = require('fs');
let Seen = {};
let Proxies = [["206.127.186.17",8080]];
let cheerio = require('cheerio')
let cheerioAdv = require('cheerio-advanced-selectors')
cheerio = cheerioAdv.wrap(cheerio)

if (FileSystem.existsSync("proxies.json")) {
    Proxies = JSON.parse(FileSystem.readFileSync("proxies.json"));
}

if (FileSystem.existsSync("seen.json")) {
    Seen = JSON.parse(FileSystem.readFileSync("seen.json"));
}

async function CheckNike() {
    try {
        let Proxy = undefined;
        if (Proxies.length > 0) {
            let ProxyTmp = Proxies.shift();
            Proxies.push(ProxyTmp);
            Proxy = tunnel.httpsOverHttp({
                proxy: {
                    host: ProxyTmp[0],
                    port: ProxyTmp[1]
                }
            })
        }
        let response = await got('https://www.nike.com/launch/', {
            json: false,
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
            },
            agent: Proxy
        });

        var $ = cheerio.load(response.body)
        var Cards = [].slice.call($('a[data-qa="product-card-link"]'));

        for (var Card of Cards) {
            let CardUrl = $(Card).attr('href');
            if (CardUrl in Seen) continue;
            Seen[CardUrl] = 1;
            SendWebHookMessage(`https://www.nike.com${CardUrl}`);
            SaveSeen();
        }
    } catch (e) {
        console.log(e);
    }
}

async function SendWebHookMessage(msg) {
    Hook.success("Captain Hook", msg)
   
}

function SaveSeen() {
    FileSystem.writeFileSync("seen.json", JSON.stringify(Seen));
}

(async () => {
    await SendWebHookMessage("Starting..");
    while (true) {
        await CheckNike();
        break;
    }
})();
