const http = require('http');
const { fetchPrices } = require('./fetchPrices');

const exchanges = ['binance', 'kucoin', 'kraken', 'mexc', 'bybit'];
const pairs = ['BTC/USDT', 'ETH/USDT', 'CAKE/USDT', 'ATOM/USDT', 'SHIB/USDT', 'PEPE/USDT'];

async function calculateROI(prices) {
    const roiResults = {};

    for (const pair in prices) {
        let bestBuyPrice = Number.POSITIVE_INFINITY;
        let bestSellPrice = 0;
        let bestBuyExchange = '';
        let bestSellExchange = '';

        for (const exchange in prices[pair]) {
            const price = prices[pair][exchange];

            if (price < bestBuyPrice) {
                bestBuyPrice = price;
                bestBuyExchange = exchange;
            }

            if (price > bestSellPrice) {
                bestSellPrice = price;
                bestSellExchange = exchange;
            }
        }

        const roi = ((bestSellPrice - bestBuyPrice) / bestBuyPrice) * 100;
        roiResults[pair] = { bestBuyExchange, bestSellExchange, roi };
    }

    return roiResults;
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/') {
        try {
            const prices = await fetchPrices(exchanges, pairs);
            const roiResults = await calculateROI(prices);

            const html = generateHTML(prices, roiResults);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(html);
            res.end();
        } catch (error) {
            console.error('Error fetching prices:', error.message);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.write('Internal Server Error');
            res.end();
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.write('Page Not Found');
        res.end();
    }
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});

function generateHTML(prices, roiResults) {
    let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Crypto Prices</title>
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
            <style>
                .buy { background-color: #d4edda; }
                .sell { background-color: #f8d7da; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="my-4">Crypto Prices</h1>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Pair</th>
                            <th>Binance</th>
                            <th>KuCoin</th>
                            <th>Kraken</th>
                            <th>MEXC</th>
                            <th>Bybit</th>
                            <th>ROI</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    for (const pair in prices) {
        html += `<tr><td>${pair}</td>`;
        const { bestBuyExchange, bestSellExchange, roi } = roiResults[pair];
        for (const exchange of exchanges) {
            const price = prices[pair][exchange] || '-';
            const className = exchange === bestBuyExchange ? 'buy' : exchange === bestSellExchange ? 'sell' : '';
            html += `<td class="${className}">${price}</td>`;
        }
        html += `<td>${roi.toFixed(2)}%</td></tr>`;
    }

    html += `
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;

    return html;
}
