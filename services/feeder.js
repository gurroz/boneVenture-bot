'use strict';

const ccxt  = require ('ccxt')
    , asTable   = require ('as-table')
    , fs        = require ('fs')
    , keysGlobal = 'keys.json'
    , keysLocal = 'keys.local.json'
    , keysFile = fs.existsSync (keysLocal) ? keysLocal : (fs.existsSync (keysGlobal) ? keysGlobal : false)
    , config = keysFile ? require ('../../' + keysFile) : {};

const configDao = require('../daos/config-dao');


const blackListCoins = ["USD", "CLP", "GBP", "EUR", "RUB", "AUD"];
const whiteListCoins = ["BCH", "ETH", "LTC"];
let proxies = [
    '', // no proxy by default
    'https://crossorigin.me/',
    'https://cors-anywhere.herokuapp.com/',
];

 module.exports = {
    updateMarketConfiguration: async function (entities, marketConfig) {
            console.log('**Starting updateMarketConfiguration');

            // MARKETS FETCH
            let ids = marketConfig.map(conf => conf.code);
            let exchanges = {};

            console.log("Markets ids are", ids.join(', '));

            // load all markets from all exchanges
            for (let id of ids) {

                let settings = config[id] || {};
                // instantiate the exchange by id
                let exchange = new ccxt[id](ccxt.extend({
                    'enableRateLimit': true
                    // verbose,
                    // 'proxy': 'https://cors-anywhere.herokuapp.com/',
                }, settings));

                // save it in a dictionary under its id for future use
                exchanges[id] = exchange;

                // load all markets from the exchange
                let markets = await exchange.loadMarkets();

                // basic round-robin proxy scheduler
                let currentProxy = 0;
                let maxRetries = proxies.length;

                for (let numRetries = 0; numRetries < maxRetries; numRetries++) {
                    try { // try to load exchange markets using current proxy

                        exchange.proxy = proxies[currentProxy];
                        await exchange.loadMarkets()

                    } catch (e) { // rotate proxies in case of connectivity errors, catch all other exceptions

                        // swallow connectivity exceptions only
                        if (e instanceof ccxt.DDoSProtection || e.message.includes('ECONNRESET')) {
                           console.log('[DDoS Protection Error] ' + e.message)
                        } else if (e instanceof ccxt.RequestTimeout) {
                            console.log('[Timeout Error] ' + e.message)
                        } else if (e instanceof ccxt.AuthenticationError) {
                            console.log('[Authentication Error] ' + e.message)
                        } else if (e instanceof ccxt.ExchangeNotAvailable) {
                            console.log('[Exchange Not Available Error] ' + e.message)
                        } else if (e instanceof ccxt.ExchangeError) {
                            console.log('[Exchange Error] ' + e.message)
                        } else {
                            throw e; // rethrow all other exceptions
                        }

                        // retry next proxy in round-robin fashion in case of error
                        currentProxy = ++currentProxy % proxies.length
                    }
                }

                console.log(id, 'loaded', exchange.symbols.length.toString(), 'markets')
            }

            console.log('**Finished updateMarketConfiguration');

            return exchanges;
        },

        getArbitrateCoins: async function () {
            console.log("** Starting getArbitrateCoins ");
            const [entities] = await configDao.list(1);
            console.log("entities  are", entities);

            let currentConfig = entities[0];

            let marketConfig = Object.assign([], currentConfig.markets);
            console.log("marketConfig  are", marketConfig);

            // MARKETS FETCH
            let ids = marketConfig.map(conf => conf.code);
            let exchanges = await this.updateMarketConfiguration(entities, marketConfig);

            // console.log("Exchanges getArbitrateCoins", exchanges);
            // get all unique symbols && filters unwanted coins
            let uniqueSymbols = ccxt.unique(ccxt.flatten(ids.map(id => exchanges[id].symbols)))
                .filter(sym => {
                    return blackListCoins.filter(blockedCoin => sym.indexOf(blockedCoin) >= 0).length === 0
                        && whiteListCoins.filter(acceptedCoin => sym.indexOf(acceptedCoin) >= 0).length > 0;
                });
            console.log("getArbitrateCoins uniqueSymbols", uniqueSymbols);

            // filter out symbols that are not present on at least two exchanges
            let arbitrableSymbols = uniqueSymbols
                .filter(symbol =>
                    ids.filter(id => (exchanges[id].symbols.indexOf(symbol) >= 0)).length > 1)
                .sort((id1, id2) => (id1 > id2) ? 1 : ((id2 > id1) ? -1 : 0));

            console.log("getArbitrateCoins arbitrableSymbols", arbitrableSymbols);


            // print a table of arbitrable symbols
            let table = arbitrableSymbols.map(symbol => {
                let row = {symbol};
                for (let id of ids)
                    if (exchanges[id].symbols.indexOf(symbol) >= 0)
                        row[id] = id;
                return row
            });

            console.log("getArbitrateCoins table", asTable.configure({delimiter: ' | '})(table));

            // PRICES FETCH
            let pricesTable = [];
            for (let symbol of arbitrableSymbols) {
                console.log('Fetching for symbol', symbol);
                for (let id of ids) {
                    let currentExchange = exchanges[id];
                    try {
                        console.log('Exchanges info', currentExchange.fees);

                        let orderbook = await currentExchange.fetchOrderBook(symbol);

                        let bid = orderbook.bids.length ? orderbook.bids[0][0] : undefined;
                        let bidAmount =  orderbook.bids.length ? orderbook.bids[0][1]  : undefined;
                        let ask = orderbook.asks.length ? orderbook.asks[0][0] : undefined;
                        let asksAmount =  orderbook.bids.length ? orderbook.asks[0][1] : undefined;

                        let spread = (bid && ask) ? ask - bid : undefined;

                        console.log(currentExchange.id, 'market price', {bid, ask, spread, bidAmount, asksAmount});
                        let uniqueCode = currentExchange.id + "/" +symbol;
                        pricesTable.push({uniqueCode, bid, ask, spread});
                    } catch (e) {
                        console.log("fetchOrderBook " + e);
                    }

                }
            }

            console.log("Prices table");
            console.log(asTable.configure({delimiter: ' | '})(pricesTable));


            // await marketsDao.list(10, async (err, exchanges, cursor) => {
            //     if (err) {
            //         console.log("Error getArbitrateCoins ", err);
            //         return;
            //   }
            // });

            console.log("** Finishing getArbitrateCoins ");

        }
};