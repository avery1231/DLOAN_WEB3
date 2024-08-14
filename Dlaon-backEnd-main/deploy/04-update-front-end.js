const { frontEndContractsFile, frontEndAbiFile } = require("../helper-hardhat-config")
const fs = require("fs")
const { network } = require("hardhat")

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END == "true") {
        //console.log("Writing to front end...")

        console.log("----------------------------------------------------")
        console.log("Updating front-end with contract addresses and ABIs...")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}

// async function updateAbi() {
//     const RegistarInvestor = await ethers.getContract("RegistarInvestor")
//     fs.writeFileSync(
//         frontEndAbiFile,
//         RegistarInvestor.interface.format(ethers.utils.FormatTypes.json)
//     )
// }

// async function updateAbi() {
//     const RegistarInvestor = await ethers.getContract("RegistarInvestor")
//     const abi = RegistarInvestor.interface.format(ethers.utils.FormatTypes.json)
//     const data = {
//         RegistarInvestorabi: {
//             abi: abi,
//         },
//     }
//     fs.writeFileSync(frontEndAbiFile, JSON.stringify(data))
// }

async function updateAbi() {
    const basicNft = await ethers.getContract("BasicNft")
    const registarInvestor = await ethers.getContract("RegistarInvestor")
    const loanDapp = await ethers.getContract("LoanDapp")

    const abis = JSON.parse(fs.readFileSync(frontEndAbiFile, "utf8"))
    abis["BasicNftabi"] = {
        abi: basicNft.interface.format(ethers.utils.FormatTypes.json),
    }
    abis["RegistarInvestorabi"] = {
        abi: registarInvestor.interface.format(ethers.utils.FormatTypes.json),
    }
    abis["BasicNftabi"] = {
        abi: basicNft.interface.format(ethers.utils.FormatTypes.json),
    }
    abis["LoanDappabi"] = {
        abi: loanDapp.interface.format(ethers.utils.FormatTypes.json),
    }

    fs.writeFileSync(frontEndAbiFile, JSON.stringify(abis))
}

async function updateContractAddresses() {
    const RegistarInvestor = await ethers.getContract("RegistarInvestor")
    const basicNft = await ethers.getContract("BasicNft")

    const loanDapp = await ethers.getContract("LoanDapp")

    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (network.config.chainId.toString() in contractAddresses) {
        let basicNftAddressFound = false
        let registarInvestorAddressFound = false
        let loanDappAddressFound = false

        for (const contractObject of contractAddresses[network.config.chainId.toString()]) {
            if (contractObject.hasOwnProperty("BasicNftaddress")) {
                basicNftAddressFound = true
            }
            if (contractObject.hasOwnProperty("RegistarInvestoraddress")) {
                registarInvestorAddressFound = true
            }
            if (contractObject.hasOwnProperty("loanDappaddress")) {
                loanDappAddressFound = true
            }
        }
        if (!basicNftAddressFound) {
            contractAddresses[network.config.chainId.toString()].push({
                BasicNftaddress: basicNft.address,
            })
        }
        if (!registarInvestorAddressFound) {
            contractAddresses[network.config.chainId.toString()].push({
                RegistarInvestoraddress: RegistarInvestor.address,
            })
        }
        if (!loanDappAddressFound) {
            contractAddresses[network.config.chainId.toString()].push({
                loanDappaddress: loanDapp.address,
            })
        }
    } else {
        contractAddresses[network.config.chainId.toString()] = [
            {
                BasicNftaddress: basicNft.address,
            },
            {
                RegistarInvestoraddress: RegistarInvestor.address,
            },
            {
                loanDappaddress: loanDapp.address,
            },
        ]
    }

    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "frontend"]
