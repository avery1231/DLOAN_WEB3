import ActiveLoans from "./components/lender.js"
import MyProposals from "./components/myGivenProposals.js"
import { ConnectButton } from "@rainbow-me/rainbowkit"

function NftPage() {
    return (
        <div>
            <div style={{ position: "fixed", top: 0, right: 0 }}>
                <ConnectButton />
            </div>

            <h1>Lender page</h1>
            <ActiveLoans />
            <div>
                <h1>My Investments</h1>
                <MyProposals />
            </div>
        </div>
    )
}

export default NftPage
