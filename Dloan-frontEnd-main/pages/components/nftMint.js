import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import { ContractAddresses, BasicNftabi } from "/constants"
function NFT() {
    const [tokenCounter, setTokenCounter] = useState(0)
    //const [account, setAccount] = useState(null)
    async function requestAccount() {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== "undefined") {
            // Request account access
            await window.ethereum.enable()
        }
        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            })
        } catch (error) {
            console.log("Error connecting...")
        }
    }

    useEffect(() => {
        async function getTokenCounter() {
            try {
                if (typeof window.ethereum !== "undefined") {
                    const provider = new ethers.providers.Web3Provider(
                        window.ethereum
                    )
                    const signer = provider.getSigner()

                    const contract = new ethers.Contract(
                        ContractAddresses.BasicNftaddress,
                        BasicNftabi,
                        signer
                    )

                    const count = await contract.getTokenCounter()

                    setTokenCounter(count)
                }
            } catch (error) {
                console.error(error)
                alert("connect wallet first")
            }
        }

        if (typeof window.ethereum !== "undefined") {
            getTokenCounter()
        }
    }, [])

    async function handleMint() {
        if (typeof window.ethereum !== "undefined") {
            await requestAccount()
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const contract = new ethers.Contract(
                ContractAddresses.BasicNftaddress,
                BasicNftabi,
                signer
            )
            try {
                const count = await contract.safeMint()
                await count.wait()

                const transaction = await contract.getTokenCounter()
                setTokenCounter(transaction)
            } catch (error) {
                console.log(error)
            }
        }
    }

    const styles = {
        container: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "20px",
            padding: "20px",
            border: "1px solid lightgray",
            borderRadius: "5px",
            boxShadow:
                "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
        },
        counterLabel: {
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "10px",
        },
        counterValue: {
            fontSize: "24px",
            fontWeight: "bold",
            color: "green",
        },
        mintButton: {
            width: "150px",
            height: "50px",
            backgroundColor: "lightblue",
            border: "none",
            borderRadius: "5px",
            fontSize: "18px",
            fontWeight: "bold",
            color: "white",
            cursor: "pointer",
            transition: "all 0.3s ease",
            "&:hover": {
                backgroundColor: "blue",
                transform: "scale(1.1)",
            },
        },
    }

    return (
        <div style={styles.container}>
            <p style={styles.counterLabel}>NFT Counter:</p>
            <p style={styles.counterValue}>{tokenCounter.toString()}</p>
            <button style={styles.mintButton} onClick={handleMint}>
                Mint NFT
            </button>
        </div>
    )
}

export default NFT
