require('dotenv').config();
const axios = require("axios");


function getTokenTx(address, from, to)
{    
    let url = "https://api.etherscan.io/api?module=account&action=tokentx&address=" + address + "&startblock=" + from + "&endblock=" + to + "&sort=asc&apikey=" + process.env.ETHERSCAN_API_KEY;
    return axios.get(url);
}

function getBlockFromTimestamp(timestamp)
{
    let url = "https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=" + timestamp.toString() + "&closest=before&apikey=" + process.env.ETHERSCAN_API_KEY;
    return axios.get(url);
}

module.exports = {
    getTokenTx,
    getBlockFromTimestamp
}