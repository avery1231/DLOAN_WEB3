import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import { ContractAddresses, LoanDappabi } from "/constants"

const ActiveProposals = () => {
    const [proposals, setProposals] = useState([])

    useEffect(() => {
        async function fetchProposals() {
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
                    const proposalCount =
                        await contract.getActiveProposalsLength()

                    // Iterate over the proposals and fetch their details
                    for (let i = 0; i < proposalCount; i++) {
                        const proposal = await contract.getAllActiveProposals(i)
                        setProposals(() => [
                            {
                                lender: proposal[0].toString(),
                                loanId: proposal[1].toString(),
                                amount: proposal[2].toString(),
                                rate: proposal[3].toString(),
                            },
                        ])
                    }
                }
            } catch (err) {
                console.error(err)
            }
        }
        if (typeof window.ethereum !== "undefined") {
            fetchProposals()
        }
    }, [])

    const handleAcceptProposal = async (loanId, lender) => {
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
                // Call the acceptProposal function to accept the proposal
                const transection = await contract.AcceptProposal(
                    loanId,
                    lender
                )
                await transection.wait()
                alert("The proposal has been accepted!")
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div>
            {proposals.map((proposal) => (
                <div key={proposal.loanId}>
                    <p>Lender: {proposal.lender}</p>
                    <p>Loan ID: {proposal.loanId}</p>
                    <p>Amount: {proposal.amount / 1e18}</p>
                    <p>Rate: {proposal.rate}</p>
                    <button
                        disabled={proposal.loanId == 0}
                        onClick={() =>
                            handleAcceptProposal(
                                proposal.loanId,
                                proposal.lender
                            )
                        }
                    >
                        Accept Proposal
                    </button>
                </div>
            ))}
        </div>
    )
}

export default ActiveProposals
