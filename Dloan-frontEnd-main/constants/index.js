const contractAddresses = require("./contractAddresses.json")
const abis = require("./abi.json")
const RegistarInvestorabi = JSON.parse(abis.RegistarInvestorabi.abi)
const BasicNftabi = JSON.parse(abis.BasicNftabi.abi)
const LoanDappabi = JSON.parse(abis.LoanDappabi.abi)

const chainId = "31337"
const contractAddressArray =
    chainId in contractAddresses ? contractAddresses[chainId] : null
let ContractAddresses = {}

contractAddressArray.forEach((item) => {
    for (const key in item) {
        ContractAddresses[key] = item[key]
    }
})

module.exports = {
    ContractAddresses,
    RegistarInvestorabi,
    BasicNftabi,
    LoanDappabi,
}
