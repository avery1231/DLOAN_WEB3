import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import { ContractAddresses, LoanDappabi } from "/constants"

const ActiveLoans = () => {
    const [loans, setLoans] = useState([])
    const [selectedLoan, setSelectedLoan] = useState({})
    const [proposalAmount, setProposalAmount] = useState("")
    const [proposalRate, setProposalRate] = useState("")

    const loanState = {
        0: "accepting",
        1: "Repaid",
        2: "awaiting Final Acceptance",
        3: "accepted",
        4: "successful",
        5: "liquidated",
    }

    useEffect(() => {
        async function fetchLoans() {
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

                    // Fetch the total number of loans
                    const loanCount = await contract.getLoanCount()

                    // Initialize an empty array to store the loan data
                    const loansData = []

                    // Iterate through all the loans and fetch their data
                    for (let i = 0; i < loanCount; i++) {
                        const result = await contract.displayBorrowerDetails(i)
                        const loan = {
                            loanId: result[0].toString(),
                            borrower: result[1],
                            amount: result[2].toString(),
                            collateral: result[3].toString(),
                            state: result[4].toString(),
                            dueDate: result[5].toString(),
                        }
                        loansData.push(loan)
                    }
                    setLoans(loansData)
                }
            } catch (err) {
                console.error(err)
            }
        }
        if (typeof window.ethereum !== "undefined") {
            fetchLoans()
        }
    }, [])

    const handleMoreDetailsClick = (loan) => {
        setSelectedLoan(loan)
    }

    const handleSubmitProposal = async (event) => {
        event.preventDefault()
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
                const weiValue = ethers.utils.parseEther(proposalAmount)
                // Submit the proposal to the contract
                const transection = await contract.NewProposal(
                    weiValue,
                    selectedLoan.borrower,
                    selectedLoan.loanId,
                    proposalRate,
                    {
                        value: weiValue,
                    }
                )
                await transection.wait()

                // Reset the form fields
                setProposalAmount("")
                setProposalRate("")
                // Reset the selected loan
                setSelectedLoan({})

                // Display a success message
                alert("Your proposal has been submitted!")
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div>
            {loans.map((loan) => (
                <div key={loan.loanId}>
                    <p>Borrower: {loan.borrower}</p>
                    <p>Amount: {loan.amount / 1e18}</p>
                    <p>Due Date: {loan.dueDate}</p>

                    <button
                        disabled={
                            loanState[loan.state.toString()] !== loanState[0]
                        }
                        onClick={() => handleMoreDetailsClick(loan)}
                    >
                        More Details
                    </button>
                </div>
            ))}
            {Object.keys(selectedLoan).length > 0 && (
                <div>
                    <h2>Selected Loan</h2>
                    <p>Collateral: {selectedLoan.collateral}</p>
                    <form onSubmit={handleSubmitProposal}>
                        <label>
                            Proposal Amount:
                            <input
                                type="number"
                                value={proposalAmount}
                                onChange={(e) =>
                                    setProposalAmount(e.target.value)
                                }
                            />
                        </label>
                        <br />
                        <label>
                            Proposal Rate:
                            <input
                                type="number"
                                value={proposalRate}
                                onChange={(e) =>
                                    setProposalRate(e.target.value)
                                }
                            />
                        </label>
                        <br />
                        <button type="submit">Submit Proposal</button>
                    </form>
                </div>
            )}
        </div>
    )
}

export default ActiveLoans
