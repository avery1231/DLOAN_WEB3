const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")

//const { verify } = require("../utils/verify")
require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("----------------------------------------------------")
    log("Deploying loanDapp and waiting for confirmations...")

    const basicNft = await ethers.getContract("BasicNft", deployer)
    const nftAddress = basicNft.address

    const loanDapp = await deploy("LoanDapp", {
        from: deployer,
        args: [nftAddress],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`loanDapp deployed at ${loanDapp.address}`)

    log("----------------------------------------------------")
    log("Approving contract address for nft")

    await basicNft.setApprovalForAll(loanDapp.address, true)
    log("Approved")
}

module.exports.tags = ["all", "loanDapp"]
