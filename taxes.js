const async = require("async");
const coingeckoApi = require('coingecko-api');
const coingecko = new coingeckoApi();

function calculate(mainAddress, txs)
{
    let i = 0;
    let tokenSwaps = getTokenSwaps(mainAddress, txs);
    let coins = await coingecko.coins.list();
    
    function test(cb)
    {
        cb(null, count < tokenSwaps.length);
    }

    function iter(cb)
    {
        let resolution = 340;
        let tokenSold = tokenSwaps[i].tokenSold;
        let tokenBought = tokenSwaps[i].tokenBought;

        Promise.all([
            coingecko.coins.fetchCoinContractMarketChartRange(tokenSold.symbol, 
                {
                    from: tokenSold.timestamp, 
                    to: Number(tokenBought.timestamp) + resolution
                }),
                coingecko.coins.fetchCoinContractMarketChartRange(tokenBought.symbol, 
                    {
                        from: tokenBought.timestamp, 
                        to: Number(tokenBought.timestamp) + resolution
                    }),
        ]).then((prices) => {
            //TODO: calculate pnl and save
        })
        .catch((error) => {
            cb(error);
        })
    }

    return async.whilst(test, iter);
}

function getCoinId(coins, symbol)
{
    symbol = symbol.toLowerCase();
    let token = coins.filter(coin => coin.symbol === symbol);
    return token[0].id;
}

function getTokenSwaps(mainAddress, txs)
{
    let tokenSwaps = [];
    let inSwap = false;
    let currentTxHash = "";
    mainAddress = mainAddress.toLowerCase();

    for(let i = 0; i < txs.length; i++)
    {
        let tx = txs[i];
        if(!inSwap && tx.from === mainAddress && i !== txs.length-1 && txs[i+1].hash === tx.hash)
        {
            inSwap = true;
            currentTxHash = tx.hash;

            let tokenBought = {
                symbol: tx.tokenSymbol,
                amount: tx.value / 10 ** tx.tokenDecimal,
                timestamp: tx.timestamp
            }

            tokenSwaps.push({tokenBought: tokenBought});

        } else
        if(inSwap && tx.hash === currentTxHash && tx.to === mainAddress)
        {
            inSwap = false;
            currentTxHash = "";

            let tokenSold = {
                symbol: tx.tokenSymbol,
                amount: tx.value / 10 ** tx.tokenDecimal,
                timestamp: tx.timestamp
            }

            tokenSwaps[tokenSwaps.length - 1].tokenSold = tokenSold;
            tokenSwaps[tokenSwaps.length - 1].txFeeEth = tx.gasPrice * tx.gasUsed / 10 ** 18;
        } else
        if(inSwap && tx.hash !== currentTxHash)
        {
            console.log("Error while extracting token swaps from transactions array");
            inSwap = false;
            currentTxHash = "";
        }
    }

    return tokenSwaps;
}

module.exports = {
    calculate
}