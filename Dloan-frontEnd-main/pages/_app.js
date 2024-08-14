import "../styles/globals.css"
import "@rainbow-me/rainbowkit/styles.css"
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { publicProvider } from "wagmi/providers/public"
import { configureChains, createClient, WagmiConfig } from "wagmi"
import {
    mainnet,
    polygon,
    optimism,
    arbitrum,
    goerli,
    localhost,
    hardhat,
} from "wagmi/chains"
const { chains, provider } = configureChains(
    [mainnet, polygon, optimism, arbitrum, goerli, localhost, hardhat],
    [publicProvider()]
)
const { connectors } = getDefaultWallets({
    appName: "My RainbowKit App",
    chains,
})
const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
})

export default function App({ Component, pageProps }) {
    return (
        <WagmiConfig client={wagmiClient}>
            <RainbowKitProvider chains={chains}>
                <Component {...pageProps} />
            </RainbowKitProvider>
        </WagmiConfig>
    )
}
