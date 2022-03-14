const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("SnowApeContract", function () {

    let snowApeContractInstance;
    let owner;
    let addr1;
    let addrs;

    before(async () => {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        const SnowApeContract = await ethers.getContractFactory("SnowApeContract");
        snowApeContractInstance = await SnowApeContract.deploy();
    });

    it("Should get initial balance and owner", async function () {
        const balance = await snowApeContractInstance.getBalance();
        expect(balance).to.eql(BigNumber.from(0));

        expect(await snowApeContractInstance.owner()).to.equal(owner.address);
    });

    it("Should deposit", async function () {
        await snowApeContractInstance.deposit({
            value: 100000
        });
        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(100000));
        expect(await snowApeContractInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(100000));

        await snowApeContractInstance.connect(addr1).deposit({
            value: 200
        });
        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(100200));
        expect(await snowApeContractInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(100000));
        expect(await snowApeContractInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(200));
    });

    it("Should withdraw", async function () {
        try {
            await snowApeContractInstance.withdraw(1000000); // too big of a withdrawal
        } catch (e) {
            expect(e.code).to.eql('INSUFFICIENT_FUNDS');
        }

        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(100200));
        expect(await snowApeContractInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(100000));
        expect(await snowApeContractInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(200));


        await snowApeContractInstance.withdraw(100000);
        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(200));
        expect(await snowApeContractInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await snowApeContractInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(200));

        await snowApeContractInstance.connect(addr1).withdraw(200);
        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(0));
        expect(await snowApeContractInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await snowApeContractInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(0));
    });

    it("Should win game", async function () {

        await snowApeContractInstance.connect(addr1).deposit({
            value: 10000
        });
        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(10000));
        expect(await snowApeContractInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await snowApeContractInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(10000));


        await snowApeContractInstance.connect(addr1).initializeOnePlayerGame(5000, 'the-game');

        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(9500));
        expect(await snowApeContractInstance.getTotalPlayerValue()).to.eql(BigNumber.from(4500));
        expect(await snowApeContractInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await snowApeContractInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(4500));

        await snowApeContractInstance.determineOutputOfOnePlayerGame(addr1.address, 'the-game', true, 10000);

        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(9500));
        expect(await snowApeContractInstance.getTotalPlayerValue()).to.eql(BigNumber.from(14500));
        expect(await snowApeContractInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await snowApeContractInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(14500));
    });

    it("Should lose game", async function () {

        await snowApeContractInstance.connect(addr1).withdraw(4500);
        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(5000));
        expect(await snowApeContractInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await snowApeContractInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(10000));

        await snowApeContractInstance.connect(addr1).initializeOnePlayerGame(6000, 'the-game');

        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(4500));
        expect(await snowApeContractInstance.getTotalPlayerValue()).to.eql(BigNumber.from(3500));
        expect(await snowApeContractInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await snowApeContractInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(3500));

        await snowApeContractInstance.determineOutputOfOnePlayerGame(addr1.address, 'the-game', false, 10000);

        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(4500));
        expect(await snowApeContractInstance.getTotalPlayerValue()).to.eql(BigNumber.from(3500));
        expect(await snowApeContractInstance.getUserBalance(owner.address)).to.eql(BigNumber.from(0));
        expect(await snowApeContractInstance.getUserBalance(addr1.address)).to.eql(BigNumber.from(3500));
    });

    it("Should throw error for no game found", async function () {
        try {
            await snowApeContractInstance.determineOutputOfOnePlayerGame(addr1.address, 'the-game', false, 10000);
        } catch (e) {
            expect(e.message).to.eql("VM Exception while processing transaction: reverted with reason string 'Game not valid.'");
        }
    });
});