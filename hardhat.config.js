/**
* @type import('hardhat/config').HardhatUserConfig
*/
require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");

const { API_URL, PRIVATE_KEY } = process.env;

// switch network from hardhat to ropsten to deploy.
module.exports = {
    solidity: "0.8.1",
    defaultNetwork: "hardhat",
    // defaultNetwork: "ropsten",
    networks: {
        hardhat: {},
        ropsten: {
            url: API_URL,
            accounts: [`0x${PRIVATE_KEY}`],
        }
    },
}