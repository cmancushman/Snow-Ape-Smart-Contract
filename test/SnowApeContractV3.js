const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("SnowApeContractV3", function () {

    let snowApeContractInstance;
    let owner;
    let addr1;
    let addrs;

    before(async () => {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        const SnowApeContract = await ethers.getContractFactory("SnowApeContractV3");
        snowApeContractInstance = await SnowApeContract.deploy([0,0,0], ['100000000000000000','100000000000000000','100000000000000000'], [0,0,0]);
    });

    it("Should get initial balance and owner", async function () {
        const balance = await snowApeContractInstance.getBalance();
        expect(balance).to.eql(BigNumber.from(0));

        expect(await snowApeContractInstance.owner()).to.equal(owner.address);
    });

    it("Should play", async function () {
        await snowApeContractInstance.joinLeague(1, {
            value: '100000000000000000'
        });
        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from('100000000000000000'));
        expect(await snowApeContractInstance.getPortfolioSize(owner.address, 1)).to.eql([1, 0]);
        await snowApeContractInstance.joinLeague(1, {
            value: '100000000000000000'
        });

        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from('200000000000000000'));
        expect(await snowApeContractInstance.getPortfolioSize(owner.address, 1)).to.eql([2, 0]);

        await snowApeContractInstance.connect(addr1).joinLeague(1, {
            value: '100000000000000000'
        });

        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from('300000000000000000'));
        expect(await snowApeContractInstance.getPortfolioSize(addr1.address, 1)).to.eql([1, 0]);

        // expect(await snowApeContractInstance.balanceOf(addr1.address)).to.eql(BigNumber.from('9999899078013810807215'));

        await snowApeContractInstance.payWinners([addr1.address], 1);
        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from(0));
        // expect(await snowApeContractInstance.balanceOf(addr1.address)).to.eql(BigNumber.from('10000199078013810807215'));

        expect(await snowApeContractInstance.getNonce(1)).to.eql(1);
        await snowApeContractInstance.joinLeague(1, {
            value: '100000000000000000'
        });
        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from('100000000000000000'));
        expect(await snowApeContractInstance.getPortfolioSize(owner.address, 1)).to.eql([1, 1]);

        await snowApeContractInstance.callNoWinner(1);
        expect(await snowApeContractInstance.getBalance()).to.eql(BigNumber.from('100000000000000000'));
        expect(await snowApeContractInstance.getNonce(1)).to.eql(2);
        expect(await snowApeContractInstance.getPortfolioSize(owner.address, 1)).to.eql([0, 2]);
    });
});