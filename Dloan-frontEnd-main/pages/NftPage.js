import NFT from "./components/nftMint.js"

import { ConnectButton } from "@rainbow-me/rainbowkit"
function NftPage() {
    return (
        <div>
            <div style={{ position: "fixed", top: 0, right: 0 }}>
                <ConnectButton />
            </div>
            <h1>My NFT Page</h1>
            <NFT />
        </div>
    )
}

export default NftPage
