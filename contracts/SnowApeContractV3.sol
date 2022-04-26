// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * This updated contract implements a 'betting pool' which is facilitated by the contract owner.
 * The contract owner no longer has permission to withdraw directly from the smart contract; rather,
 * they only have the ability to control how the betting pool is distributed.
 *
 * Additions/changes: bettingPoolBalance, getBettingPoolBalance, initializeOnePlayerGame, determineOutputOfOnePlayerGame
 */
contract SnowApeContractV3 is Ownable {
    uint16[] public LEAGUE_NONCES = [0, 0, 0];

    uint256[] public LEAGUE_FEES = [
        10000000000000000, // monkey league
        100000000000000000, // gorilla league
        1000000000000000000 // kong league
    ];

    address private payoutAddress;

    mapping(uint16 => mapping(uint16 => uint32)) LEAGUE_PLAYER_COUNTS;
    mapping(uint16 => mapping(uint16 => uint256)) LEAGUE_TOTAL_FEES;
    mapping(uint16 => mapping(uint16 => mapping(address => uint16))) portfolioCounts;
    mapping(uint16 => uint256) lastLeagueStartDates;

    /**
     * Calculates the fee based on the number of days that have occured since the league was started
     * @param leagueId the league on which to calculate the fee
     * @return fee
     */
    function getFee(uint16 leagueId) private view returns (uint256) {
        uint256 day = block.timestamp / 86400;
        uint256 leagueFee = LEAGUE_FEES[leagueId];
        uint256 leagueStartDay = lastLeagueStartDates[leagueId];

        if ((leagueStartDay == 0) || day <= (leagueStartDay + 2)) {
            // first league or still the weekend, do not charge a late fee
            return leagueFee;
        }

        return leagueFee + (leagueFee / 10) * (day - 2 - leagueStartDay);
    }

    /**
        Returns current nonce for a league
        * @return nonce
     */
    function getNonce(uint16 leagueId) public view returns (uint16) {
        return LEAGUE_NONCES[leagueId];
    }

    /**
        Returns current nonces for all leagues
        * @return nonce
     */
    function getNonces() public view returns (uint16[] memory) {
        return LEAGUE_NONCES;
    }

    /**
     * @dev Gets the balance of the smart contract.
     * @return currentBalance
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Gets the balance of an address.
     * @return currentBalance
     */
    function balanceOf(address adr) public view returns (uint256) {
        return address(adr).balance;
    }

    /**
     * @dev Gets the number of portfolios an address is entitled to.
     * @param player the address of the player
     * @param leagueId the id of the league
     * @return portfolioSize
     */
    function getPortfolioSize(address player, uint16 leagueId)
        public
        view
        returns (uint16, uint16)
    {
        uint16 leagueNonce = LEAGUE_NONCES[leagueId];
        return (portfolioCounts[leagueId][leagueNonce][player], leagueNonce);
    }

    /**
     * Sets payout address of contract
     * @param adr the address to send funds to on payouts
     */
    function setPayoutAddress(address adr) public onlyOwner {
        payoutAddress = adr;
    }

    /**
     * @dev Joins a league.
     * @param leagueId the leagueId (for determining bet size)
     */
    function joinLeague(uint16 leagueId) public payable {
        require(
            msg.value >= getFee(leagueId),
            "Insufficient payment to play game."
        );
        uint16 leagueNonce = LEAGUE_NONCES[leagueId];

        portfolioCounts[leagueId][leagueNonce][msg.sender]++;
        LEAGUE_PLAYER_COUNTS[leagueId][leagueNonce]++;
        LEAGUE_TOTAL_FEES[leagueId][leagueNonce] += msg.value;
    }

    /**
     * @dev Pays the winner of a league. The winner recievs the league's player count * base league fee,
     * while the owner recieves the total late fees charged.
     * @param players the address of the players who won
     * @param leagueId the leagueId (for determining bet size)
     */
    function payWinners(address[] calldata players, uint16 leagueId)
        public
        onlyOwner
    {
        uint16 leagueNonce = LEAGUE_NONCES[leagueId];
        uint32 leaguePlayerCount = LEAGUE_PLAYER_COUNTS[leagueId][leagueNonce];
        uint256 payout = leaguePlayerCount * LEAGUE_FEES[leagueId];
        uint256 payoutPerWinner = payout / players.length;
        uint256 roundingExtra = payout - (payoutPerWinner * players.length);

        for (uint8 i = 0; i < players.length; i++) {
            require(
                portfolioCounts[leagueId][leagueNonce][players[i]] > 0,
                "Not a valid player"
            );
            address payable gameFeeBeneficiary = payable(players[i]);
            (bool sent, ) = gameFeeBeneficiary.call{value: payoutPerWinner}("");

            assert(sent);
        }

        uint256 totalFeesCollected = LEAGUE_TOTAL_FEES[leagueId][leagueNonce];
        uint256 ownerPayout = (totalFeesCollected - payout) + roundingExtra;

        if (ownerPayout != 0) {
            address payable owner = (payoutAddress == address(0))
                ? payable(owner())
                : payable(payoutAddress);
            (bool success, ) = owner.call{value: ownerPayout}("");

            assert(success);
        }

        LEAGUE_NONCES[leagueId]++;
        lastLeagueStartDates[leagueId] = block.timestamp / 86400;
    }

    /**
     * @dev Pays no winner, but collects late fees and moves the whole pot into next week's league.
     * @param leagueId the leagueId (for determining bet size)
     */
    function callNoWinner(uint16 leagueId) public onlyOwner {
        uint16 leagueNonce = LEAGUE_NONCES[leagueId];
        uint32 leaguePlayerCount = LEAGUE_PLAYER_COUNTS[leagueId][leagueNonce];
        uint256 payout = leaguePlayerCount * LEAGUE_FEES[leagueId];

        uint256 totalFeesCollected = LEAGUE_TOTAL_FEES[leagueId][leagueNonce];
        uint256 ownerPayout = (totalFeesCollected - payout);

        if (ownerPayout != 0) {
            address payable owner = (payoutAddress == address(0))
                ? payable(owner())
                : payable(payoutAddress);
            (bool success, ) = owner.call{value: ownerPayout}("");

            assert(success);
        }

        LEAGUE_NONCES[leagueId]++;
        lastLeagueStartDates[leagueId] = block.timestamp / 86400;

        uint16 newLeagueNonce = LEAGUE_NONCES[leagueId];

        LEAGUE_PLAYER_COUNTS[leagueId][newLeagueNonce] = leaguePlayerCount;
        LEAGUE_TOTAL_FEES[leagueId][newLeagueNonce] = payout;
    }

    function addLeague(uint256 leagueFee) public onlyOwner returns (uint256) {
        LEAGUE_FEES.push(leagueFee);
        LEAGUE_NONCES.push(0);

        return LEAGUE_FEES.length - 1;
    }
}
