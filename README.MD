# Money Carlo Smart Contract 
## Abstract
- Gaming and user-driven websites not yet at-scale suffer from deposit/withdrawal delays and struggle to earn user trust. Use of funds is not apparent, nor is liquidity in a centralized custodial service such as Robinhood, Draftkings, Fanduel, etc.. They are used and trusted because of their brand awareness and reputation, not because of their transparency or ability to handle funds. This situation that faces less prominent custodial entities can be improved by moving the custody of funds from internal reserves to an external smart contract.

## About
- This smart contract handles user deposits & withdrawls, as well as allowing players to initialize games and the owner of the contract to verify the outcome of games.
- User balances are matched against total contract reserves. A contract balance greater than total player value indicates a surplus, which the contract owner can use to provide better in-game odds and ensures that withdrawls can be met. A contract balance less than total player value indicates that not all withdrawls can be met, and that the contract owner should supply the contract with funds to ensure continued gaming.
## Development
- Install node: https://nodejs.org/en/download/
- Run `npm i --save hardhat`
- Enter credentials & API endpoint in .env file
- To test, run `npx hardhat test`
- To deploy, change the default environment in `hardhat.config.js` and run `npx hardhat --network ropsten run scripts/deploy.js`

## Todos
- Add support for multiplayer game initiation & resolution
- Adjust fees and maximum bet size to be non-arbitrary numbers
- Add more tests

## Some notes
- This is not a trustless smart contract. Though there are some checks put in place (max bet size) there are aspects of it that are centralized. 
- It is meant to be deployed by a good-faith actor i.e an organization with feduciary responsibilities.
