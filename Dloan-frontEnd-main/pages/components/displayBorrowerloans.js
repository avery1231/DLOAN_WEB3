import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import { ContractAddresses, LoanDappabi } from "/constants"

const DisplayBorrowerLoans = () => {
    const [loanId, setLoanId] = useState(1)
    const [loan, setLoan] = useState({})
    const [amount, setAmount] = useState("")
    const [repayAmount, setRepayAmount] = useState()
    async function contractInitializer() {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()

            const contract = new ethers.Contract(
                ContractAddresses.loanDappaddress,
                LoanDappabi,
                signer
            )
            return contract
        } catch (error) {
            console.log(error)
        }
    }

    const handleLockLoan = async (loanId) => {
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

                // Lock the loan in the contract
                const transaction = await contract.LockLoan(loanId)
                await transaction.wait()

                // Display a success message
                alert("Loan has been locked!")
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleRepayLoan = async (loanId) => {
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
                const weiValue = ethers.utils.parseEther(amount.toString())
                // Repay the loan in the contract
                const transaction = await contract.RepayLoan(loanId, weiValue, {
                    value: weiValue,
                })
                await transaction.wait()

                // Display a success message
                alert("Loan has been repaid!")
            }
        } catch (err) {
            console.error(err)
        }
    }
    const getRepayAmount = async (_rate, pastTimestamp, _amounttoPay) => {
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
                if (pastTimestamp == 0) {
                    setRepayAmount(0)
                } else {
                    const currentTimestamp =
                        await contract.getCurrentTimeStamp()
                    //console.log(currentTimestamp.toString())
                    //console.log(pastTimestamp)
                    let _hours =
                        (currentTimestamp.toString() - pastTimestamp) / 3600
                    console.log(_hours)
                    let interest = (_rate * _hours * _amounttoPay) / 72000
                    let amount = interest + _amounttoPay
                    console.log(amount)
                    setRepayAmount(amount)
                    return amount
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    const loanState = {
        0: "accepting",
        1: "Repaid",
        2: "awaiting Final Acceptance",
        3: "accepted",
        4: "successful",
        5: "liquidated",
    }

    useEffect(() => {
        async function fetchLoan() {
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
                    //const currentTimestamp = await contract.getCurrentTimeStamp()
                    //console.log(currentTimestamp.toNumber())
                    const result = await contract.displayBorrowerLoans(loanId)

                    //console.log(result[6].toString())
                    setLoan({
                        loanId: result[0].toString(),
                        amount: result[1].toString(),
                        collateral: result[2].toString(),
                        state: loanState[result[3].toString()],
                        proposalCount: result[4].toString(),
                        dueDate: result[5].toString(),
                        pastTimestamp: result[6].toString(),
                        Rate: result[7].toString(),
                    })
                }
            } catch (err) {
                console.error(err)
            }
        }
        if (typeof window.ethereum !== "undefined") {
            fetchLoan()
        }
    }, [loanId, contractInitializer])

    return (
        <div>
            <input
                type="number"
                value={loanId}
                onChange={(e) => setLoanId(Number(e.target.value))}
            />
            <button onClick={() => setLoanId(loanId + 1)}>Next Loan</button>
            {Object.keys(loan).length > 0 ? (
                <div>
                    <p>Loan ID: {loan.loanId}</p>
                    <p>Amount: {loan.amount / 1e18}</p>
                    <p>Collateral: {loan.collateral}</p>
                    <p>State: {loan.state}</p>
                    <p>Proposal Count: {loan.proposalCount}</p>
                    <p>Due Date: {loan.dueDate}</p>
                    <p>Rate: {loan.Rate}</p>
                    <button
                        type="button"
                        onClick={() =>
                            getRepayAmount(
                                loan.Rate,
                                loan.pastTimestamp,
                                loan.amount / 1e18
                            )
                        }
                    >
                        Repay amount
                    </button>

                    <p>Repay amount: {repayAmount}</p>
                    <button
                        disabled={
                            loan.loanId == 0 ||
                            loan.state == "successful" ||
                            loan.state == "accepting"
                        }
                        onClick={() => handleLockLoan(loan.loanId)}
                    >
                        Lock Loan
                    </button>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                    />
                    <button onClick={() => handleRepayLoan(loanId)}>
                        Repay Loan
                    </button>
                </div>
            ) : (
                <p>Loading loan data...</p>
            )}
        </div>
    )
}

export default DisplayBorrowerLoans
