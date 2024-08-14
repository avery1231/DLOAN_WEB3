import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import { ContractAddresses, LoanDappabi, BasicNftabi } from "/constants"

const ApplyLoan = () => {
    const [amount, setAmount] = useState("")
    const [dueDate, setDueDate] = useState("")

    const [tokenIDs, setTokenIDs] = useState([])
    const [collateral, setCollateral] = useState("")

    const date1 = new Date(dueDate)
    const date2 = new Date() // current date

    const diff = Math.abs(date1 - date2) // difference in milliseconds
    const days = Math.ceil(diff / 86400000) // number of days

    async function getBalance() {
        try {
            if (typeof window.ethereum !== "undefined") {
                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                )
                const signer = provider.getSigner()

                const contract = new ethers.Contract(
                    ContractAddresses.loanDappaddress,
                    LoanDappabi,
                    signer
                )

                const count = await contract.getContractBalance()

                //console.log(count.toString())
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleApprove = async () => {
        try {
            if (typeof window.ethereum !== "undefined") {
                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                )

                const signer = provider.getSigner()
                const nftContract = new ethers.Contract(
                    ContractAddresses.BasicNftaddress,
                    BasicNftabi,
                    signer
                )
                console.log(nftContract)
                console.log(ContractAddresses.loanDappaddress)
                console.log(ContractAddresses.BasicNftaddress)
                const bal = await nftContract.giveApproval(
                    ContractAddresses.loanDappaddress,
                    collateral
                )
                await bal.wait()
                alert("approve done")
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            if (typeof window.ethereum !== "undefined") {
                await handleApprove()
                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                )

                const signer = provider.getSigner()

                //console.log(ContractAddresses.loanDappaddress)
                const contract = new ethers.Contract(
                    ContractAddresses.loanDappaddress,
                    LoanDappabi,
                    signer
                )
                //console.log(typeof tokenIDs)
                // console.log(Number(amount * 1e18))

                // console.log(typeof Number(amount))
                // console.log(typeof collateral)
                // console.log(typeof days)
                // console.log(typeof dueDate)
                const weiValue = ethers.utils.parseEther(amount)
                //console.log(Number(weiValue))
                const count = await contract.ApplyLoan(
                    weiValue,
                    days,
                    collateral,
                    dueDate
                )
                await count.wait()
                alert("done")
            }
        } catch (error) {
            console.log(error)
        }
    }
    useEffect(() => {
        async function fetchNFTs() {
            try {
                if (typeof window.ethereum !== "undefined") {
                    const provider = new ethers.providers.Web3Provider(
                        window.ethereum
                    )
                    const signer = provider.getSigner()
                    const walletAddress = await provider
                        .getSigner()
                        .getAddress()
                    //console.log(ContractAddresses.BasicNftaddress)
                    const nftContract = new ethers.Contract(
                        ContractAddresses.BasicNftaddress,
                        BasicNftabi,
                        signer
                    )
                    //console.log(nftContract)
                    //console.log(ContractAddresses.BasicNftaddress)
                    try {
                        const balance = await nftContract.getTokenIds(
                            walletAddress
                        )
                        //console.log(balance)
                        let array = []
                        for (let i = 0; i < balance.length; i++) {
                            array.push(balance[i].toNumber())

                            //console.log(balance[i].toNumber())
                        }
                        setTokenIDs(array)
                        // Update the collateral state variable to the value of the selected option in the dropdown menu
                        setCollateral(array[0])
                        await getBalance()
                    } catch (error) {
                        console.log(error)
                    }
                }
            } catch (error) {
                console.log(error)
                alert("connect wallet first")
            }
        }
        fetchNFTs()
    }, [])

    // the empty array tells useEffect to only run this function once when the component is mounted

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <h1 style={{ margin: "10px 0" }}>Apply for Loan</h1>
            <label
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                }}
            >
                Loan Amount:
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                        margin: "5px 0",
                        padding: "5px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                    }}
                />
            </label>
            <label
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                }}
            >
                Due Date:
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{
                        margin: "5px 0",
                        padding: "5px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        width: "140px",
                        height: "19px",
                    }}
                />
            </label>
            <label>
                Collateral:
                <br></br>
                <select
                    value={collateral}
                    onChange={(e) => setCollateral(e.target.value)}
                    style={{
                        margin: "5px 0",
                        padding: "5px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        height: "28px",
                        width: "150px",
                    }}
                >
                    {tokenIDs.map((tokenID) => (
                        <option key={tokenID} value={tokenID}>
                            {tokenID}
                        </option>
                    ))}
                </select>
            </label>
            <button type="submit" style={{ margin: "10px 0" }}>
                Apply for Loan
            </button>
        </form>
    )
}

export default ApplyLoan
