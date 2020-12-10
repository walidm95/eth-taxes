const etherscan = require('./etherscan-api');
const express = require("express");
const taxes = require('./taxes');

const app = express();
const port = 3000;

app.get('/taxes', (req, res) => {
    let address = req.query.address;
    let fromTimestamp = req.query.from;
    let toTimestamp = req.query.to;
    
    if(!address)
    {
        res.status(400).send("Eth address missing");
    }
    if(!fromTimestamp)
    {
        res.status(400).send("'From' timestamp missing");
    }
    if(!toTimestamp)
    {
        res.status(400).send("'To' timestamp missing");
    }

    let startBlockPromise = etherscan.getBlockFromTimestamp(fromTimestamp);
    let endBlockPromise = etherscan.getBlockFromTimestamp(toTimestamp);

    Promise.all([startBlockPromise, endBlockPromise])
        .then((blocks) => {
            if(blocks[0].data.status == 0)
            {
                res.status(400).send(blocks[0].data.result);
            } else
            if(blocks[1].data.status == 0)
            {
                res.status(400).send(blocks[1].data.result);
            } else
            {
                let startBlock = blocks[0].data.result;
                let endBlock = blocks[1].data.result;

                etherscan.getTokenTx(address, startBlock, endBlock)
                    .then((transactions) => {
                        if(transactions.data.status == 0)
                        {
                            res.status(400).send(transactions.data.result);
                        } else
                        {
                            taxes.calculate(address, transactions.data.result)
                                .then((results) => {
                                    res.status(200).send(results);
                                })
                                .catch((error) => {
                                    res.status(400).send(error.message);
                                });
                        }
                    })
                    .catch((error) => {
                        res.status(400).send(error.message);
                    });
            }
        })
        .catch((error) => {
            res.status(400).send(error.message);
        });
});
  
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
