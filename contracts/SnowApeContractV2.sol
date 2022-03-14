// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * This updated contract implements a 'betting pool' which is facilitated by the contract owner.
 * The contract owner no longer has permission to withdraw directly from the smart contract; rather,
 * they only have the ability to control how the betting pool is distributed.
 *
 * Additions/changes: bettingPoolBalance, getBettingPoolBalance, initializeOnePlayerGame, determineOutputOfOnePlayerGame
 */
contract SnowApeContractV2 is Ownable {
    uint256 public GAME_FEE = 500; // gas fee paid to team wallet to validate each game
    uint256 public MAX_BET_SIZE = 100000; // maximum bet size

    uint256 totalPlayerValue = 0; // combined value of all player wallets
    mapping(string => bool) games; // a mapping of each game to if it is valid
    mapping(address => uint256) balances; // a mapping of each address to its balance
    uint256 bettingPoolBalance; // the size of the betting pool balance

    /**
     * @dev Gets the balance of the smart contract.
     * @return currentBalance
     */
    function getBalance() public view returns (uint256) {
        uint256 currentBalance = address(this).balance;
        return currentBalance;
    }

    /**
     * @dev Gets the total sum of all player balances.
     * @return totalPlayerValue
     */
    function getTotalPlayerValue() public view returns (uint256) {
        return totalPlayerValue;
    }

    /**
     * @dev Gets the total value locked in the betting pool.
     * @return bettingPoolBalance
     */
    function getBettingPoolBalance() public view returns (uint256) {
        return bettingPoolBalance;
    }

    /**
     * @dev Verifies that the caller of a function has sufficient funds.
     */
    modifier sufficientFunds(uint256 amount) {
        require(balances[msg.sender] >= amount, "Insufficient funds.");
        _;
    }

    /**
     * @dev Verifies that the bet size is less than the maximum bet size.
     */
    modifier betSizeIsAllowed(uint256 betSize) {
        require(betSize <= MAX_BET_SIZE, "This bet is too large.");
        _;
    }

    /**
     * @dev Verifies that the bet size is less than the maximum bet size.
     */
    modifier bettingPoolHasFunds(uint256 payoutSize) {
        require(payoutSize <= bettingPoolBalance, "This bet is too large.");
        _;
    }

    /**
     * @dev Gets the balance of a user.
     * @return the balance of address
     */
    function getUserBalance(address adr) public view returns (uint256) {
        return balances[adr];
    }

    /**
     * @dev Deposit funds into address.
     */
    function deposit() public payable {
        balances[msg.sender] += msg.value;
        totalPlayerValue += msg.value;
    }

    /**
     * @dev Withdraw funds from address.
     * @param withdrawalAmount the amout to be withdrawn
     */
    function withdraw(uint256 withdrawalAmount)
        public
        sufficientFunds(withdrawalAmount)
        returns (bool)
    {
        require(
            getBalance() >= withdrawalAmount,
            "Insufficient reserves to process this withdrawal."
        );
        address payable withdrawalAddress = payable(msg.sender);
        (bool sent, ) = withdrawalAddress.call{value: withdrawalAmount}("");

        if (sent) {
            balances[msg.sender] -= withdrawalAmount;
            totalPlayerValue -= withdrawalAmount;
        }
        return sent;
    }

    /**
     * @dev Initialize one player game, reduces balance, depostist into betting pool,
     * and adds an entry for the game id.
     * @param betSize the amount of money being bet
     * @param gameId the unique id of the game
     */
    function initializeOnePlayerGame(uint256 betSize, string memory gameId)
        public
        sufficientFunds(betSize + GAME_FEE)
        betSizeIsAllowed(betSize)
    {
        require(
            getBalance() >= GAME_FEE,
            "Insufficient reserves to play game."
        );
        address payable gameFeeBeneficiary = payable(owner());
        (bool sent, ) = gameFeeBeneficiary.call{value: GAME_FEE}("");

        if (sent) {
            balances[msg.sender] -= (betSize + GAME_FEE);
            totalPlayerValue -= (betSize + GAME_FEE);
            bettingPoolBalance += betSize;
            games[gameId] = true;
        }
    }

    /**
     * @dev Validates the result of a bet and pays out a player if they won. 
     * @param player the address of the player
     * @param gameId the unique id of the game
     * @param playerDidWin true if the winner did win, otherwise false
     * @param betPayout the amount to pay out
     */
    function determineOutputOfOnePlayerGame(
        address player,
        string memory gameId,
        bool playerDidWin,
        uint256 betPayout
    ) public onlyOwner bettingPoolHasFunds(betPayout) {
        require(games[gameId] == true, "Game not valid.");

        if (playerDidWin == true) {
            balances[player] += betPayout;
            totalPlayerValue += betPayout;
            bettingPoolBalance -= betPayout;
        }

        games[gameId] = false;
    }
}
