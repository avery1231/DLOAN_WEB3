import { ethers } from "ethers"
import { ContractAddresses, RegistarInvestorabi } from "/constants"

import { useEffect, useState } from "react"

const currentDate = new Date()
const month = currentDate.getMonth() + 1 // the getMonth() method returns a zero-based month, so we need to add 1 to get the actual month number
const day = currentDate.getDate()
const year = currentDate.getFullYear()
const currentHour = currentDate.getHours()
const currentMinute = currentDate.getMinutes()
const currentSecond = currentDate.getSeconds()

const formattedDate = `${month}/${day}/${year}`
const Datee = `${month}${day}${year}`
const formattedtime = `${currentHour}${currentMinute}`

function generateRandomNumber() {
    return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000)
}
const randomNumber = generateRandomNumber()

function AddInvestorPage() {
    const [message, setMessage] = useState("")
    const [currentGreeting, setCurrentGreeting] = useState("")
    // State for the form data
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        RegistrationNumber: randomNumber,
    })

    const handleChange = (event) => {
        const { name, value } = event.target
        setFormData({ ...formData, [name]: value })
    }

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
            setWalletAddress(accounts[0])
        } catch (error) {
            console.log("Error connecting...")
        }
    }

    //  Helper Functions

    const handleSubmit = async (event) => {
        event.preventDefault()
        // Submit form data here...
        if (!formData.name && !formData.email) return

        // If MetaMask exists

        if (typeof window.ethereum !== "undefined") {
            await requestAccount()

            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()

            // Create contract with signer
            const contract = new ethers.Contract(
                ContractAddresses.RegistarInvestaddress,
                RegistarInvestorabi,
                signer
            )
            console.log(formData.name)

            // Send transaction to add investor data
            const transaction = await contract.addInvestorData(
                formData.name,
                formData.email,
                randomNumber,
                Datee,
                formattedtime
            )

            // Reset form fields

            // Wait for transaction to be mined
            await transaction.wait()
            alert("done")
            fetchInvestordata()
            // Clear form fields
            const randomNum = generateRandomNumber()
            setFormData({
                name: "",
                email: "",
                RegistrationNumber: randomNum,
            })
        }
    }

    async function fetchInvestordata() {
        // If MetaMask exists
        if (typeof window.ethereum !== "undefined") {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const contract = new ethers.Contract(
                ContractAddresses.RegistarInvestaddress,
                abi,
                provider
            )
            try {
                // Call Greeter.greet() and display current greeting in `console`
                /* 
        function greet() public view returns (string memory) {
          return greeting;
        }
      */
                const data = await contract.getInvestorData(randomNumber)
                console.log(data)
            } catch (error) {
                console.log("Error: ", error)
            }
        }
    }

    return (
        <div>
            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <h1 style={{ margin: "10px 0" }}>Add Investor</h1>
                <label
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                    }}
                >
                    Organisation Name:
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
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
                    Investor Address:
                    <input
                        type="text"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
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
                    Registration Number:
                    <input
                        type="text"
                        value={formData.RegistrationNumber}
                        onChange={handleChange}
                        style={{
                            margin: "10px 0",
                            padding: "10px",
                            borderRadius: "10px",
                            border: "1px solid #ccc",
                        }}
                        disabled
                    />
                </label>
                <label
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                    }}
                >
                    Registration Date:
                    <input
                        type="text"
                        value={formattedDate}
                        onChange={handleChange}
                        style={{
                            margin: "5px 0",
                            padding: "5px",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                        }}
                        disabled
                    />
                </label>
                <br />
                <button type="submit">Submit</button>
            </form>
            <div></div>
        </div>
    )
}

export default AddInvestorPage
