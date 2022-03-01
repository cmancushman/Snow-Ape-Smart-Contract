const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("MoneyCarlo", function () {

    let moneyCarloInstance;
    let owner;
    let addr1;
    let addrs;

    before(async () => {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        const MoneyCarlo = await ethers.getContractFactory("MoneyCarlo");
        moneyCarloInstance = await MoneyCarlo.deploy();
    });

    it("Should get initial balance and owner", async function () {
        const balance = await moneyCarloInstance.getBalance();
        expect(balance).to.eql(BigNumber.from(0));

        expect(await moneyCarloInstance.owner()).to.equal(owner.address);
    });

    it("Should deposit", async function () {
        await moneyCarloInstance.deposit({
            value: 100000
        });
        expect(await moneyCarloInstance.getBalance()).to.eql(BigNumber.from(100000));
        expect(await moneyCarloInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(100000));

        await moneyCarloInstance.connect(addr1).deposit({
            value: 200
        });
        expect(await moneyCarloInstance.getBalance()).to.eql(BigNumber.from(100200));
        expect(await moneyCarloInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(100000));
        expect(await moneyCarloInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(200));
    });

    it("Should withdraw", async function () {
        try {
            await moneyCarloInstance.withdraw(1000000); // too big of a withdrawal
        } catch (e) {
            expect(e.code).to.eql('INSUFFICIENT_FUNDS');
        }

        expect(await moneyCarloInstance.getBalance()).to.eql(BigNumber.from(100200));
        expect(await moneyCarloInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(100000));
        expect(await moneyCarloInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(200));


        await moneyCarloInstance.withdraw(100000);
        expect(await moneyCarloInstance.getBalance()).to.eql(BigNumber.from(200));
        expect(await moneyCarloInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await moneyCarloInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(200));

        await moneyCarloInstance.connect(addr1).withdraw(200);
        expect(await moneyCarloInstance.getBalance()).to.eql(BigNumber.from(0));
        expect(await moneyCarloInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await moneyCarloInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(0));
    });

    it("Should win game", async function () {

        await moneyCarloInstance.connect(addr1).deposit({
            value: 10000
        });
        expect(await moneyCarloInstance.getBalance()).to.eql(BigNumber.from(10000));
        expect(await moneyCarloInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await moneyCarloInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(10000));


        await moneyCarloInstance.connect(addr1).initializeOnePlayerGame(5000, 'the-game');

        expect(await moneyCarloInstance.getBalance()).to.eql(BigNumber.from(9500));
        expect(await moneyCarloInstance.getTotalPlayerValue()).to.eql(BigNumber.from(4500));
        expect(await moneyCarloInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await moneyCarloInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(4500));

        await moneyCarloInstance.determineOutputOfOnePlayerGame(addr1.address, 'the-game', true, 10000);

        expect(await moneyCarloInstance.getBalance()).to.eql(BigNumber.from(9500));
        expect(await moneyCarloInstance.getTotalPlayerValue()).to.eql(BigNumber.from(14500));
        expect(await moneyCarloInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await moneyCarloInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(14500));
    });

    it("Should lose game", async function () {

        await moneyCarloInstance.connect(addr1).withdraw(4500);
        expect(await moneyCarloInstance.getBalance()).to.eql(BigNumber.from(5000));
        expect(await moneyCarloInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await moneyCarloInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(10000));

        await moneyCarloInstance.connect(addr1).initializeOnePlayerGame(6000, 'the-game');

        expect(await moneyCarloInstance.getBalance()).to.eql(BigNumber.from(4500));
        expect(await moneyCarloInstance.getTotalPlayerValue()).to.eql(BigNumber.from(3500));
        expect(await moneyCarloInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await moneyCarloInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(3500));

        await moneyCarloInstance.determineOutputOfOnePlayerGame(addr1.address, 'the-game', false, 10000);

        expect(await moneyCarloInstance.getBalance()).to.eql(BigNumber.from(4500));
        expect(await moneyCarloInstance.getTotalPlayerValue()).to.eql(BigNumber.from(3500));
        expect(await moneyCarloInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await moneyCarloInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(3500));
    });

    it("Should throw error for no game found", async function () {
        try {
            await moneyCarloInstance.determineOutputOfOnePlayerGame(addr1.address, 'the-game', false, 10000);
        } catch (e) {
            expect(e.message).to.eql("VM Exception while processing transaction: reverted with reason string 'Game not valid.'");
        }
    });
});