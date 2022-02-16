async function main() {
    const Simcade = await ethers.getContractFactory("Simcade")

    // Start deployment, returning a promise that resolves to a contract object
    const simcadeInstance = await Simcade.deploy()
    await simcadeInstance.deployed()
    console.log("Contract deployed to address:", simcadeInstance.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
