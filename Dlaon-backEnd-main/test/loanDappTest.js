const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Loan Dapp Unit Tests", function () {
          let loanDapp, deployer, basicNft, loanDappSecond, tester, accounts
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              tester = accounts[2]
              arguments = []
              await deployments.fixture(["all"])
              basicNft = await ethers.getContract("BasicNft", deployer)
              loanDapp = await ethers.getContract("LoanDapp", deployer)

              loanDappSecond = await ethers.getContract("LoanDapp", tester)

              const txResponse = await basicNft.safeMint()
              await txResponse.wait(1)
              await basicNft.safeMint()
          })

          describe("initial state", function () {
              it("sets the owner and NFT contract correctly", async () => {
                  const owner = await loanDapp.getOwner()
                  const nft = await loanDapp.erc721()

                  assert.equal(owner, deployer.address, "Owner should be the deployer")
                  assert.equal(nft, basicNft.address, "NFT contract should be set correctly")
                  const nftOwner = await basicNft.ownerOfNft("1")
                  assert.equal(nftOwner, deployer.address)
              })
          })
          describe("applyLoan()", function () {
              beforeEach(async () => {
                  // Get the current time in seconds

                  const amount = ethers.utils.parseEther("2")

                  const dueDate = 30

                  const collateral = "1"
                  const paymentDate = "14-03-2023"

                  // Apply for a loan with the NFT collateral, due date in 30 days, and payment date in 30 days
                  const txs = await loanDapp.ApplyLoan(amount, dueDate, collateral, paymentDate)
                  await txs.wait(1)
              })
              it("should apply loan with valid inputs", async () => {
                  // Check if the loan was successfully applied
                  const nftId = 1
                  const borrowerCount = await loanDapp.getLoanCount()
                  const borrower = await loanDapp.displayBorrowerDetails(borrowerCount - 1)
                  assert.equal(borrower[0].toString(), "1", "loan id should be equal to 1")
                  assert.equal(
                      borrower[1],
                      deployer.address,
                      "address of borrower should be equal to deployer"
                  )
                  assert.equal(
                      borrower[2].toString(),
                      ethers.utils.parseEther("2").toString(),
                      "Loan amount should be 2 ETH"
                  )
                  assert.equal(borrower[3].toNumber(), nftId, "Loan id should be 1")
                  assert.equal(borrower[4].toString(), "0", "Loan state should be Accepting")
                  assert.equal(
                      borrower[5].toString(),
                      "14-03-2023",
                      "Payment date should be 30 days from now"
                  )
                  const borrowerDetails = await loanDapp.displayBorrowerLoans("1")
                  assert.equal(borrowerDetails[0].toString(), "1", "Loan id should be 1")
                  assert.equal(
                      borrowerDetails[1].toString(),
                      ethers.utils.parseEther("2").toString(),
                      "Loan amount should be 2 ETH"
                  )
                  assert.equal(borrowerDetails[2].toString(), nftId, "Loan id should be 1")
                  assert.equal(borrowerDetails[3].toString(), "0", "Loan state should be Accepting")
                  assert.equal(borrowerDetails[4].toString(), "0", "proposal count should be 0")
                  assert.equal(
                      borrower[5].toString(),
                      "14-03-2023",
                      "Payment date should be 30 days from now"
                  )
                  assert.equal(borrowerDetails[6].toString(), "0", "dayspassed should be 0")
                  assert.equal(borrowerDetails[7].toString(), "0", "rate should be 0")
              })
              it("should revert with invalid collateral error", async () => {
                  // Get the current time in seconds
                  const now = (await ethers.provider.getBlock("latest")).timestamp
                  const amount = ethers.utils.parseEther("1")
                  const dueDate = now + 30 * 24 * 60 * 60
                  const collateral = "1"
                  const paymentDate = "14-03-2023"
                  await expect(
                      loanDapp.ApplyLoan(amount, dueDate, collateral, paymentDate)
                  ).to.be.revertedWith("InvalidCollateral")
              })
              it("reverts when the caller is not the owner of the NFT used as collateral", async () => {
                  const now = (await ethers.provider.getBlock("latest")).timestamp
                  const amount = ethers.utils.parseEther("1")
                  const dueDate = now + 30 * 24 * 60 * 60
                  const invalidCollateral = 2
                  const paymentDate = "14-03-2023"

                  await expect(
                      loanDappSecond.ApplyLoan(amount, dueDate, invalidCollateral, paymentDate)
                  ).to.be.revertedWith("Only the owner can transfer the NFT")
              })
              it("should tranfer collateral to contract from owner", async () => {
                  const nftOwner = await basicNft.ownerOfNft("1")
                  assert.equal(nftOwner, loanDapp.address, "nft transfer failed")
              })
              describe("NewProposal()", function () {
                  let loanDappLenderConnected, borrowerAddress, sigs, amount, loanId, rate
                  beforeEach(async () => {
                      borrowerAddress = accounts[0]
                      loanId = 1
                      amount = ethers.utils.parseEther("1.5")
                      rate = 5
                      sigs = await ethers.getSigners()
                      loanDappLenderConnected = await loanDapp.connect(sigs[1])

                      await loanDappLenderConnected.NewProposal(
                          amount,
                          borrowerAddress.address,
                          loanId,
                          rate,
                          {
                              value: amount,
                          }
                      )
                  })
                  it("should add a new lender proposal to an active loan ", async function () {
                      const proposalData = await loanDappLenderConnected.getMyProposals(0)
                      assert.equal(
                          proposalData[0],
                          borrowerAddress.address,
                          "Borrower address does not match"
                      )
                      assert.equal(
                          proposalData[1].toString(),
                          ethers.utils.parseEther("1.5").toString(),
                          "Amount does not match"
                      )
                      assert.equal(proposalData[2].toString(), "5", "Rate does not match")
                      assert.equal(
                          proposalData[3].toString(),
                          "14-03-2023",
                          "Due date does not match"
                      )
                      assert.equal(proposalData[4].toString(), "0", "State does not match")
                      assert.equal(proposalData[5].toString(), "1", "Loan ID does not match")
                  })
                  it("should return default values for a non-lender", async function () {
                      let loanDappNonLenderConnected = await loanDapp.connect(sigs[2])
                      const proposalData = await loanDappNonLenderConnected.getMyProposals(0)

                      assert.equal(
                          proposalData[0].toString(),
                          "0x0000000000000000000000000000000000000000",
                          "Borrower address should be zero"
                      )
                      assert.equal(proposalData[1].toString(), "0", "Amount should be zero")
                      assert.equal(proposalData[2].toString(), "0", "Rate should be zero")
                      assert.equal(proposalData[3], "0", "Due date should be zero")
                      assert.equal(proposalData[4].toString(), "0", "State does not match")
                      assert.equal(proposalData[5], "0", "Loan ID should be zero")
                  })
                  it("updates the balance of contract", async function () {
                      const balance = await loanDapp.getContractBalance()
                      assert.equal(balance.toString(), amount, "Balance not updated correctly")
                  })
                  it("should revert if proposal already active", async function () {
                      await expect(
                          loanDappLenderConnected.NewProposal(
                              amount,
                              borrowerAddress.address,
                              loanId,
                              rate,
                              {
                                  value: amount,
                              }
                          )
                      ).to.be.revertedWith("InvalidProposal")
                  })
                  it("should revert if loan state is not 'accepting'", async function () {
                      await loanDapp.AcceptProposal(1, sigs[1].address)
                      const loanDappLenderTwoConnected = await loanDapp.connect(sigs[2])

                      await expect(
                          loanDappLenderTwoConnected.NewProposal(
                              amount,
                              borrowerAddress.address,
                              loanId,
                              rate,
                              {
                                  value: amount,
                              }
                          )
                      ).to.be.revertedWith("loanStateInvalid")
                  })
                  it("should revert if proposal amount is greater than loan amount", async function () {
                      const loanDappLenderTwoConnected = await loanDapp.connect(sigs[2])

                      await expect(
                          loanDappLenderTwoConnected.NewProposal(
                              amount + 1, // proposal amount greater than loan amount
                              borrowerAddress.address,
                              loanId,
                              rate,
                              {
                                  value: amount + 1,
                              }
                          )
                      ).to.be.revertedWith("Invalidamount")
                  })

                  describe("AcceptProposal()", function () {
                      beforeEach("accept proposal", async () => {
                          await loanDapp.AcceptProposal(1, sigs[1].address)
                      })
                      it("should revert if loan ID is invalid", async function () {
                          // Try to accept a proposal with an invalid loan ID
                          await expect(
                              loanDapp.AcceptProposal(99, sigs[1].address)
                          ).to.be.revertedWith("InvalidLoanId")
                      })
                      it("should update details of borrower", async function () {
                          // Try to accept a proposal with an invalid loan ID
                          const nftId = 1
                          const borrowerCount = await loanDapp.getLoanCount()
                          const borrower = await loanDapp.displayBorrowerDetails(borrowerCount - 1)

                          assert.equal(borrower[0].toString(), "1", "loan id should be equal to 1")
                          assert.equal(
                              borrower[1],
                              deployer.address,
                              "address of borrower should be equal to deployer"
                          )
                          assert.equal(
                              borrower[2].toString(),
                              amount.toString(),
                              "Loan amount should be 1.5 ETH in array"
                          )
                          assert.equal(borrower[3].toNumber(), nftId, "Loan id should be 1")
                          assert.equal(
                              borrower[4].toString(),
                              2,
                              "Loan state should be awaitingFinalAcceptance"
                          )
                          assert.equal(
                              borrower[5].toString(),
                              "14-03-2023",
                              "Payment date should be 30 days from now"
                          )
                          const borrowerDetails = await loanDapp.displayBorrowerLoans("1")
                          assert.equal(borrowerDetails[0].toString(), "1", "Loan id should be 1")
                          assert.equal(
                              borrowerDetails[1].toString(),
                              amount.toString(),
                              "Loan amount should be 1.5 ETH"
                          )
                          assert.equal(borrowerDetails[2].toString(), nftId, "Loan id should be 1")
                          assert.equal(
                              borrowerDetails[3].toString(),
                              "2",
                              "Loan state should be awaitingFinalAcceptance"
                          )
                          assert.equal(
                              borrowerDetails[4].toString(),
                              "1",
                              "proposal count should be 1"
                          )
                          assert.equal(
                              borrower[5].toString(),
                              "14-03-2023",
                              "Payment date should be 30 days from now"
                          )
                          assert.equal(borrowerDetails[6].toString(), "0", "dayspassed should be 0")
                          assert.equal(borrowerDetails[7].toString(), rate, "rate should be 5")
                      })
                      it("should update details of lender", async function () {
                          const proposalData = await loanDappLenderConnected.getMyProposals(0)
                          assert.equal(
                              proposalData[0],
                              borrowerAddress.address,
                              "Borrower address does not match"
                          )
                          assert.equal(
                              proposalData[1].toString(),
                              ethers.utils.parseEther("1.5").toString(),
                              "Amount does not match"
                          )
                          assert.equal(proposalData[2].toString(), "5", "Rate does not match")
                          assert.equal(
                              proposalData[3].toString(),
                              "14-03-2023",
                              "Due date does not match"
                          )
                          assert.equal(proposalData[4].toString(), "4", "State does not match")
                          assert.equal(proposalData[5].toString(), "1", "Loan ID does not match")
                      })
                      describe("LockLoan()", function () {
                          it("should revert if loan ID is invalid", async function () {
                              // Try to lock a loan with an invalid loan ID
                              await expect(loanDapp.LockLoan(99)).to.be.revertedWith(
                                  "InvalidLoanId"
                              )
                          })

                          it("should lock the loan and update state for borrower and lender", async function () {
                              const borrowerCount = await loanDapp.getLoanCount()

                              await loanDapp.LockLoan(1)

                              const borrowerBalance = await ethers.provider.getBalance(
                                  sigs[0].address
                              )

                              // Verify that the borrower's state has been updated
                              const updatedBorrower = await loanDapp.displayBorrowerDetails(
                                  borrowerCount - 1
                              )

                              assert.equal(
                                  updatedBorrower[4].toString(),
                                  "4",
                                  "Loan state should be successful"
                              )

                              const borrowerDetails = await loanDapp.displayBorrowerLoans("1")
                              assert.notEqual(
                                  borrowerDetails[6].toString(),
                                  "0",
                                  "timestamp should be greater than 0"
                              )
                              // Check that loan state is Repaid
                              assert.equal(
                                  borrowerDetails[3].toString(),
                                  "4",
                                  "Loan should have state successfull"
                              )

                              // Verify that the lender's proposal state has been updated
                              const proposalData = await loanDappLenderConnected.getMyProposals(0)
                              assert.equal(
                                  proposalData[4].toString(),
                                  "1",
                                  "Proposal state should be accepted"
                              )

                              // Verify that the borrower's account balance has increased by the loan amount

                              assert.equal(
                                  Math.floor(ethers.utils.formatEther(borrowerBalance)),
                                  10001,
                                  "borrower balance should have increased by loan amount"
                              )
                          })
                      })
                      describe("RepayLoan()", function () {
                          it("should fail if loan has not been locked", async () => {
                              const loanId = 1
                              const amount = 1000

                              await expect(
                                  loanDapp.RepayLoan(loanId, amount, {
                                      value: ethers.utils.parseEther("3"),
                                  })
                              ).to.be.revertedWith("InvalidLoan")
                          })
                          it("should fail if repaying loan before 24 hours of successful loan completion", async () => {
                              const loanId = 1
                              const amount = 1000

                              // Set loan state to successful
                              await loanDapp.LockLoan(loanId)

                              // Repay loan before 24 hours
                              await expect(
                                  loanDapp.RepayLoan(loanId, amount, {
                                      value: ethers.utils.parseEther("3"),
                                  })
                              ).to.be.revertedWith("waitForOneDay")
                          })
                          it("should fail if repaying loan with amount less than required amount", async () => {
                              const loanId = 1
                              const amount = ethers.utils.parseEther("1")
                              // Set loan state to successful
                              await loanDapp.LockLoan(loanId)

                              await network.provider.send("evm_increaseTime", [90000])
                              await network.provider.request({ method: "evm_mine", params: [] })

                              // Repay loan with less than required amount
                              await expect(
                                  loanDapp.RepayLoan(loanId, amount, {
                                      value: ethers.utils.parseEther("3"),
                                  })
                              ).to.be.revertedWith("Enter correct amount")
                          })
                          it("should fail if sending eth less than required amount", async () => {
                              const loanId = 1
                              const amount = ethers.utils.parseEther("1")
                              // Set loan state to successful
                              await loanDapp.LockLoan(loanId)

                              await network.provider.send("evm_increaseTime", [90000])
                              await network.provider.request({ method: "evm_mine", params: [] })

                              // Repay loan with less than required amount
                              await expect(
                                  loanDapp.RepayLoan(loanId, amount, {
                                      value: amount,
                                  })
                              ).to.be.revertedWith("send more ether")
                          })
                          it("should succeed and transfer collateral back to borrower", async () => {
                              const loanId = 1
                              const amount = ethers.utils.parseEther("2")
                              const collateralId = 1
                              // Set loan state to successful
                              await loanDapp.LockLoan(loanId)
                              await network.provider.send("evm_increaseTime", [2.592e6])
                              await network.provider.request({ method: "evm_mine", params: [] })
                              const repayamount = await loanDapp.getRepayAmount(loanId)
                              const OldNftOwner = await basicNft.ownerOfNft("1")
                              assert.equal(
                                  OldNftOwner,
                                  loanDapp.address,
                                  "Collateral owner should be contract"
                              )

                              // Repay loan with correct amount
                              const tx = await loanDapp.RepayLoan(loanId, repayamount, {
                                  value: repayamount,
                              })
                              await tx.wait(1)

                              const borrowerCount = await loanDapp.getLoanCount()
                              const borrower = await loanDapp.displayBorrowerDetails(
                                  borrowerCount - 1
                              )
                              const borrowerDetails = await loanDapp.displayBorrowerLoans("1")
                              const proposalData = await loanDappLenderConnected.getMyProposals(0)

                              // Check that loan state is Repaid
                              assert.equal(
                                  borrowerDetails[3].toString(),
                                  "1",
                                  "Loan should have state Repaid"
                              )

                              assert.equal(
                                  borrower[4].toString(),
                                  "1",
                                  "Loan state should be Repaid here "
                              )
                              assert.equal(proposalData[4].toString(), "3", "State does not match")

                              const nftOwner = await basicNft.ownerOfNft("1")
                              assert.equal(
                                  nftOwner,
                                  deployer.address,
                                  "Collateral should be transferred back to borrower"
                              )

                              // Check that collateral is not verified
                              assert.equal(
                                  await loanDapp.collateralVerifyMap(collateralId),
                                  false,
                                  "Collateral should not be verified"
                              )
                          })
                      })
                      describe("liqBorrower()", function () {
                          it("should liquidate borrower when loan is overdue", async () => {
                              const loanId = 1

                              // Set loan state to successful
                              await loanDapp.LockLoan(loanId)
                              // Increase time to 32 days after due date
                              await ethers.provider.send("evm_increaseTime", [32 * 24 * 60 * 60])
                              await ethers.provider.send("evm_mine")

                              // Try to liquidate borrower
                              await loanDappLenderConnected.liqBorrower(1, deployer.address)
                              const borrowerCount = await loanDapp.getLoanCount()
                              const borrower = await loanDapp.displayBorrowerDetails(
                                  borrowerCount - 1
                              )
                              const borrowerDetails = await loanDapp.displayBorrowerLoans("1")
                              const proposalData = await loanDappLenderConnected.getMyProposals(0)
                              assert.equal(
                                  borrowerDetails[3].toString(),
                                  "5",
                                  "Loan should have state liquidated"
                              )

                              assert.equal(
                                  borrower[4].toString(),
                                  "5",
                                  "Loan state should be liquidated here "
                              )
                              assert.equal(
                                  proposalData[4].toString(),
                                  "5",
                                  "Loan state should also be liquidated here"
                              )

                              const nftOwner = await basicNft.ownerOfNft("1")

                              assert.equal(
                                  nftOwner,
                                  sigs[1].address,
                                  "Collateral should be transferred to lender"
                              )

                              // Check that collateral is not verified
                              assert.equal(
                                  await loanDapp.collateralVerifyMap(1),
                                  false,
                                  "Collateral should not be verified"
                              )
                          })
                          it("should revert if called before loan is overdue", async function () {
                              const loanId = 1

                              // Set loan state to successful
                              await loanDapp.LockLoan(loanId)
                              // Increase time to 4 days after due date
                              await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60])
                              await ethers.provider.send("evm_mine")
                              await expect(
                                  loanDappLenderConnected.liqBorrower(1, deployer.address)
                              ).to.be.revertedWith("InvalidAction")
                          })
                      })
                  })
              })
              describe("multiple proposals and accept proposal", function () {
                  it("should add a new lender proposal to an active loan and accept 1 proposal and update contract balance", async function () {
                      // Create multiple proposals for the same lender
                      let borrowerAddress, loanId, amount, rate, sigs, checkAmount

                      loanId = 1
                      amount = ethers.utils.parseEther("1.5")
                      rate = 5
                      sigs = await ethers.getSigners()
                      borrowerAddress = sigs[0]

                      for (let i = 1; i < 6; i++) {
                          let lenders = await loanDapp.connect(sigs[i])
                          await lenders.NewProposal(amount, borrowerAddress.address, loanId, rate, {
                              value: amount,
                          })
                      }

                      // Check that all proposals were added correctly
                      for (let i = 1; i < 6; i++) {
                          let lenders = await loanDapp.connect(sigs[i])
                          const proposalData = await lenders.getMyProposals(i - 1)

                          assert.equal(
                              proposalData[0],
                              borrowerAddress.address,
                              "Borrower address does not match"
                          )
                          assert.equal(
                              proposalData[1].toString(),
                              ethers.utils.parseEther("1.5").toString(),
                              "Amount does not match"
                          )
                          assert.equal(proposalData[2].toString(), "5", "Rate does not match")
                          assert.equal(
                              proposalData[3].toString(),
                              "14-03-2023",
                              "Due date does not match"
                          )
                          assert.equal(proposalData[4].toString(), "0", "State does not match")
                          assert.equal(proposalData[5].toString(), "1", "Loan ID does not match")
                      }
                      const balance = await loanDapp.getContractBalance()

                      assert.equal(
                          balance.toString(),
                          "7500000000000000000",
                          "Balance not updated correctly"
                      )
                      await loanDapp.AcceptProposal(1, sigs[2].address)
                      const newBalance = await loanDapp.getContractBalance()

                      assert.equal(
                          newBalance.toString(),
                          "1500000000000000000",
                          "Balance not updated correctly"
                      )
                  })

                  it("should revert if proposal already active", async function () {
                      // Create a proposal
                      let borrowerAddress, loanId, amount, rate, sigs

                      loanId = 1
                      amount = ethers.utils.parseEther("1.5")
                      rate = 5
                      sigs = await ethers.getSigners()
                      borrowerAddress = sigs[0]

                      for (let i = 1; i < 6; i++) {
                          let lenders = await loanDapp.connect(sigs[i])
                          await lenders.NewProposal(amount, borrowerAddress.address, loanId, rate, {
                              value: amount,
                          })
                      }

                      let lenders = await loanDapp.connect(sigs[5])

                      // Try to create the same proposal again
                      await expect(
                          lenders.NewProposal(amount, borrowerAddress.address, loanId, rate, {
                              value: amount,
                          })
                      ).to.be.revertedWith("InvalidProposal")
                  })
              })
          })
      })
