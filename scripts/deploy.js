async function main() {
    const MoneyCarlo = await ethers.getContractFactory("SnowApeContractV3")

    // Start deployment, returning a promise that resolves to a contract object
    const moneyCarloInstance = await MoneyCarlo.deploy()
    await moneyCarloInstance.deployed()
    console.log("Contract deployed to address:", moneyCarloInstance.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
