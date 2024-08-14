import { ConnectButton } from "@rainbow-me/rainbowkit"
//import styles from "../styles/Home.module.css"
import AddInvestor from "./components/addInvestor"
export default function addInvestorData() {
    return (
        <div>
            {/* <Homee /> */}
            <div style={{ position: "fixed", top: 0, right: 0 }}>
                <ConnectButton />
            </div>
            <AddInvestor></AddInvestor>
        </div>
    )
}
