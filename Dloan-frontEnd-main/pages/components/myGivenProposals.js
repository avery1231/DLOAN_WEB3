import React, { useState, useEffect } from "react"
import { Contract, ethers } from "ethers"
import { ContractAddresses, LoanDappabi } from "/constants"
const MyProposals = () => {
    const [proposals, setProposals] = useState([])
    const [loading, setLoading] = useState(false)
    const proposalState = {
        0: "waiting",
        1: "accepted",
        2: "Rejected",
        3: "Repaid",
        4: "awaiting Final Acceptance",
        5: "liquidated",
    }
    const handleLiquidateBorrower = async (loanId, borrowerAddress) => {
        setLoading(true)
        try {
            if (typeof window.ethereum !== "undefined") {
                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                )
                const signer = provider.getSigner()

                const contract = new Contract(
                    ContractAddresses.loanDappaddress,
                    LoanDappabi,
                    signer
                )

                // Call the `liqBorrower` function on the contract
                const transaction = await contract.liqBorrower(
                    loanId,
                    borrowerAddress
                )
                await transaction.wait()

                // Display a success message
                alert("Borrower has been liquidated!")
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Fetch the list of proposals
        async function fetchProposals() {
            try {
                if (typeof window.ethereum !== "undefined") {
                    const provider = new ethers.providers.Web3Provider(
                        window.ethereum
                    )
                    const signer = provider.getSigner()

                    const contract = new Contract(
                        ContractAddresses.loanDappaddress,
                        LoanDappabi,
                        signer
                    )

                    const proposalCount =
                        await contract.getActiveProposalsLength()

                    // Iterate over the proposals and fetch their details

                    for (let i = 0; i < proposalCount; i++) {
                        const proposal = await contract.getMyProposals(i)
                        setProposals(() => [
                            {
                                borrower: proposal[0].toString(),
                                amount: proposal[1].toString(),
                                rate: proposal[2].toString(),
                                dueDate: proposal[3].toString(),
                                State: proposalState[proposal[4].toString()],
                                loanId: proposal[5].toString(),
                            },
                        ])
                    }
                }
            } catch (err) {
                console.error(err)
            }
        }

        fetchProposals()
    }, [])

    return (
        <div>
            <h1>Proposals</h1>
            {proposals.map((proposal) => (
                <div key={proposal.borrower}>
                    <p>Borrower: {proposal.borrower}</p>
                    <p>Amount: {proposal.amount / 1e18}</p>
                    <p>Rate: {proposal.rate}</p>
                    <p>Due Date: {proposal.dueDate}</p>
                    <p>State: {proposal.State}</p>
                    <button
                        onClick={() =>
                            handleLiquidateBorrower(
                                proposal.loanId,
                                proposal.borrower
                            )
                        }
                        disabled={
                            loading ||
                            proposal.State == "waiting" ||
                            proposal.State == "Rejected" ||
                            proposal.State == "awaiting Final Acceptance" ||
                            proposal.State == "Repaid" ||
                            proposal.State == "liquidated"
                        }
                    >
                        Liquidate Borrower
                    </button>
                </div>
            ))}
        </div>
    )
}

export default MyProposals
