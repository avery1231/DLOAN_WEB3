import React from "react"
import { Container, Row, Col } from "react-bootstrap"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import ApplyLoan from "./components/applyLoan"
import ActiveProposals from "./components/displayProposals.js"
import DisplayBorrowerLoans from "./components/displayBorrowerloans.js"
const LoanPage = () => {
    const css = `
    .container {
      background-color: #f2f2f2;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      padding: 30px;
    }
  `
    return (
        <div>
            <div style={{ position: "fixed", top: 0, right: 0 }}>
                <ConnectButton />
            </div>
            <div>
                <Container className="mt-5">
                    <Row className="justify-content-center">
                        <Col md={6}>
                            <ApplyLoan />
                        </Col>
                    </Row>
                </Container>
            </div>
            <DisplayBorrowerLoans />
            <h1>My Received Proposal</h1>
            <div>
                <ActiveProposals />
            </div>
        </div>
    )
}

export default LoanPage
