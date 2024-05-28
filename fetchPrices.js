const ccxt = require('ccxt');

async function fetchPrices(exchanges, pairs) {
    const prices = {};

    try {
        // Iteramos sobre cada par de intercambio
        for (const exchangeName of exchanges) {
            const exchange = new ccxt[exchangeName]();
            await exchange.loadMarkets();

            for (const pair of pairs) {
                // Verificamos si el par está disponible en el mercado de este intercambio
                if (exchange.symbols && exchange.symbols.includes(pair)) {
                    if (!prices[pair]) prices[pair] = {};

                    const ticker = await exchange.fetchTicker(pair);
                    prices[pair][exchangeName] = ticker.last;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching prices:', error.message);
    }

    return prices;
}

module.exports = { fetchPrices };
