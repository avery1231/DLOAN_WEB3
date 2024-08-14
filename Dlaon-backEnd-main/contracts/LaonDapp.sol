// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

error InvalidCollateral();
error loanStateInvalid();
error InvalidProposal();
error Invalidamount();
error InvalidLoanId();
error waitForOneDay();
error InvalidLoan();
error InvalidAction();

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "contracts/nftCollection.sol";
import "hardhat/console.sol";

library TimeStampHelper {
    function getHour(uint currentTimestamp, uint pastTimestamp) internal pure returns (uint hour) {
        hour = (currentTimestamp - pastTimestamp) / 3600;
    }
}

contract LoanDapp is IERC721Receiver {
    BasicNft public immutable erc721;
    address private immutable i_owner;

    constructor(address _nftAddress) {
        i_owner = msg.sender;

        erc721 = BasicNft(_nftAddress);
    }

    // Events
    event LoanApplied(
        address indexed borrower,
        uint256 loanId,
        uint256 amount,
        uint256 dueDate,
        uint256 collateral
    );
    event ProposalMade(
        address borrower,
        uint256 loanId,
        uint256 amount,
        uint256 rate,
        address lender
    );
    event ProposalAccepted(
        address borrower,
        uint256 loanId,
        uint256 amount,
        uint256 rate,
        address lender
    );
    event LoanRepaid(address borrower, uint256 loanId, uint256 amount);
    event LoanDefaulted(address borrower, uint256 loanId, uint256 collateral);

    enum proposalState {
        waiting,
        accepted,
        Rejected,
        Repaid,
        awaitingFinalAcceptance,
        liquidated
    }

    enum loanState {
        accepting,
        Repaid,
        awaitingFinalAcceptance,
        accepted,
        successful,
        liquidated
    }
    // dueDate stores number of days for which we will apply loan
    // Dayspassed stores time stamp when loan was locked
    // payment date stores date of loan
    struct Borrower {
        address AddressofBorrower;
        uint256 dueDate;
        uint256 loanId;
        uint256 collateral;
        loanState state;
        uint256 amount;
        uint256 proposalCount;
        uint256 rate;
        uint256 Dayspassed;
        string paymentDate;
    }

    struct LenderProposal {
        address payable AddressofBorrower;
        uint256 dueDate;
        uint256 amount;
        uint256 loanId;
        proposalState state;
        uint256 rate;
        address payable Lender;
    }

    struct borrowerDetails {
        uint256 loanId;
        address AddressofBorrower;
        uint256 amount;
        uint256 collateral;
        loanState state;
        string paymentDate;
    }

    mapping(address => mapping(uint256 => Borrower)) BorrowerInfoMap;
    mapping(address => uint256) BorrowerLoanCountMap;
    mapping(uint256 => bool) public collateralVerifyMap;

    LenderProposal[] private LenderProposalArray;
    borrowerDetails[] public borrowerDetailsArray;

    function loanCountMap() internal {
        uint256 loanNum = BorrowerLoanCountMap[msg.sender];
        loanNum++;
        BorrowerLoanCountMap[msg.sender] = loanNum;
    }

    function AnyActiveLoan(uint256 _collateral) internal view {
        if (collateralVerifyMap[_collateral] == true) {
            revert InvalidCollateral();
        }
    }

    function ApplyLoan(
        uint256 _amount,
        uint256 _DueDate,
        uint256 _collateral,
        string memory _paymentDate
    ) public {
        AnyActiveLoan(_collateral);
        loanCountMap();
        require(
            erc721.ownerOfNft(_collateral) == msg.sender,
            "Only the owner can transfer the NFT"
        );
        Borrower storage borrower = BorrowerInfoMap[msg.sender][BorrowerLoanCountMap[msg.sender]];

        borrower.AddressofBorrower = msg.sender;
        borrower.amount = _amount;
        borrower.collateral = _collateral;
        borrower.loanId = BorrowerLoanCountMap[msg.sender];
        borrower.state = loanState.accepting;
        borrower.dueDate = _DueDate;
        borrower.paymentDate = _paymentDate;
        collateralVerifyMap[_collateral] = true;
        borrowerDetailsArray.push(
            borrowerDetails(
                BorrowerLoanCountMap[msg.sender],
                msg.sender,
                _amount,
                _collateral,
                loanState.accepting,
                _paymentDate
            )
        );
        // Transfer the NFT to the contract
        erc721.transferNft(msg.sender, address(this), _collateral);
        emit LoanApplied(
            msg.sender,
            BorrowerLoanCountMap[msg.sender],
            _amount,
            _DueDate,
            _collateral
        );
    }

    function NewProposal(
        uint256 _amount,
        address _BorrowerAddress,
        uint256 _loanId,
        uint _rate
    ) public payable {
        checkActiveProposal(_loanId, _BorrowerAddress);
        Borrower storage borrower = BorrowerInfoMap[_BorrowerAddress][_loanId];

        if (borrower.state != loanState.accepting) {
            revert loanStateInvalid();
        }
        if (_amount > borrower.amount) {
            revert Invalidamount();
        }

        LenderProposalArray.push(
            LenderProposal(
                payable(_BorrowerAddress),
                0,
                msg.value,
                _loanId,
                proposalState.waiting,
                _rate,
                payable(msg.sender)
            )
        );

        uint256 Propcount = borrower.proposalCount;
        Propcount++;
        borrower.proposalCount = Propcount;
    }

    function AcceptProposal(uint256 _loanId, address _Lender) public {
        require(BorrowerLoanCountMap[msg.sender] > 0, "loan not active");
        if (
            BorrowerInfoMap[msg.sender][_loanId].state == loanState.accepting &&
            BorrowerInfoMap[msg.sender][_loanId].loanId == _loanId
        ) {
            for (uint i = 0; i < LenderProposalArray.length; i++) {
                if (
                    msg.sender == LenderProposalArray[i].AddressofBorrower &&
                    _loanId == LenderProposalArray[i].loanId
                ) {
                    if (_Lender == LenderProposalArray[i].Lender) {
                        require(
                            LenderProposalArray[i].state == proposalState.waiting,
                            "proposal already accepted or invalid"
                        );
                        Borrower storage borrower = BorrowerInfoMap[msg.sender][_loanId];
                        LenderProposalArray[i].state = proposalState.awaitingFinalAcceptance;
                        LenderProposalArray[i].dueDate = borrower.dueDate;
                        borrower.amount = LenderProposalArray[i].amount;

                        borrower.state = loanState.awaitingFinalAcceptance;
                        borrower.rate = LenderProposalArray[i].rate;
                        bool status = updateState(msg.sender, 1, LenderProposalArray[i].amount);
                        require(status, "failed to update array");
                        continue;
                    }

                    LenderProposalArray[i].state = proposalState.Rejected;

                    (bool success, ) = LenderProposalArray[i].AddressofBorrower.call{
                        value: LenderProposalArray[i].amount
                    }("");
                    require(success, "Failed to send Ether");
                }
            }
        } else {
            revert InvalidLoanId();
        }
    }

    function checkActiveProposal(uint256 _loanId, address _BorrowerAddress) internal view {
        for (uint256 i = 0; i < LenderProposalArray.length; i++) {
            if (
                msg.sender == LenderProposalArray[i].Lender &&
                _BorrowerAddress == LenderProposalArray[i].AddressofBorrower &&
                _loanId == LenderProposalArray[i].loanId
            ) {
                revert InvalidProposal();
            }
        }
    }

    function LockLoan(uint256 _loanId) public {
        require(BorrowerLoanCountMap[msg.sender] > 0, "loan not active");
        if (
            BorrowerInfoMap[msg.sender][_loanId].state == loanState.awaitingFinalAcceptance &&
            BorrowerInfoMap[msg.sender][_loanId].loanId == _loanId
        ) {
            Borrower storage borrower = BorrowerInfoMap[msg.sender][_loanId];
            borrower.state = loanState.successful;
            borrower.Dayspassed = block.timestamp;
            bool status = updateState(msg.sender, 2, 0);
            require(status, "update failed at lock loan");
            for (uint256 i = 0; i < LenderProposalArray.length; i++) {
                if (
                    msg.sender == LenderProposalArray[i].AddressofBorrower &&
                    LenderProposalArray[i].state == proposalState.awaitingFinalAcceptance &&
                    _loanId == LenderProposalArray[i].loanId
                ) {
                    LenderProposalArray[i].state = proposalState.accepted;
                    (bool sent, ) = payable(msg.sender).call{value: LenderProposalArray[i].amount}(
                        ""
                    );
                    require(sent, "Failed to send Ether");
                }
            }
        } else {
            revert InvalidLoanId();
        }
    }

    function RepayLoan(uint256 _LoanId, uint256 _amount) public payable {
        Borrower storage borrower = BorrowerInfoMap[msg.sender][_LoanId];
        uint Hours = TimeStampHelper.getHour(block.timestamp, borrower.Dayspassed);

        if (Hours >= 24) {
            if (borrower.state != loanState.successful) {
                revert InvalidLoan();
            }

            uint256 _hours = TimeStampHelper.getHour(block.timestamp, borrower.Dayspassed);

            uint256 value = _getRepayAmount(borrower.rate, borrower.amount, _hours);
            require(msg.value >= value, "send more ether");
            require(_amount >= value, "Enter correct amount");

            uint256 RemainAmount = _amount - value;

            for (uint256 i = 0; i < LenderProposalArray.length; i++) {
                if (
                    msg.sender == LenderProposalArray[i].AddressofBorrower &&
                    _LoanId == LenderProposalArray[i].loanId &&
                    LenderProposalArray[i].state == proposalState.accepted
                ) {
                    address payable _to = LenderProposalArray[i].Lender;
                    LenderProposalArray[i].state = proposalState.Repaid;
                    borrower.state = loanState.Repaid;
                    bool status = updateState(msg.sender, 3, 0);
                    require(status, "update failed at repay loan");
                    (bool sent, ) = _to.call{value: value}("");
                    require(sent, "Failed to send Ether to lender");

                    (bool sentt, ) = msg.sender.call{value: RemainAmount}("");
                    require(sentt, "Failed to send Ether");

                    // tranfer nft back to borrower

                    erc721.transferNft(address(this), msg.sender, borrower.collateral);
                    collateralVerifyMap[borrower.collateral] = false;
                }
            }
        } else {
            revert waitForOneDay();
        }
    }

    /**
     * if days is greater then number of days for which we
     * took loan  and did not repay on time
     * lender will take our collateral
     *
     *
     */

    function liqBorrower(uint256 _loanId, address _address) external returns (bool) {
        Borrower storage borrower = BorrowerInfoMap[_address][_loanId];
        uint256 _hours = TimeStampHelper.getHour(block.timestamp, borrower.Dayspassed);
        uint256 Days = _hours / 24;

        if (borrower.state == loanState.successful && Days > borrower.dueDate) {
            for (uint256 i = 0; i < LenderProposalArray.length; i++) {
                if (
                    msg.sender == LenderProposalArray[i].Lender &&
                    _loanId == LenderProposalArray[i].loanId &&
                    Days > LenderProposalArray[i].dueDate &&
                    LenderProposalArray[i].AddressofBorrower == borrower.AddressofBorrower &&
                    borrower.state == loanState.successful &&
                    Days > borrower.dueDate
                ) {
                    borrower.state = loanState.liquidated;
                    bool status = updateState(borrower.AddressofBorrower, 4, 0);
                    require(status, "update failed at liqBorrower");

                    collateralVerifyMap[borrower.collateral] = false;
                    LenderProposalArray[i].state = proposalState.liquidated;
                    erc721.transferNft(address(this), msg.sender, borrower.collateral);
                    borrower.collateral = 0;
                    return true;
                }
            }
        } else {
            revert InvalidAction();
        }
        return false;
    }

    function updateState(
        address _address,
        uint256 num,
        uint256 _amount
    ) internal returns (bool status) {
        for (uint i = 0; i < borrowerDetailsArray.length; i++) {
            if (
                borrowerDetailsArray[i].AddressofBorrower == _address &&
                borrowerDetailsArray[i].state == loanState.accepting &&
                num == 1
            ) {
                borrowerDetailsArray[i].state = loanState.awaitingFinalAcceptance;
                borrowerDetailsArray[i].amount = _amount;
                return true;
            }
            if (
                borrowerDetailsArray[i].AddressofBorrower == _address &&
                borrowerDetailsArray[i].state == loanState.awaitingFinalAcceptance &&
                num == 2
            ) {
                borrowerDetailsArray[i].state = loanState.successful;
                return true;
            }
            if (
                borrowerDetailsArray[i].AddressofBorrower == _address &&
                borrowerDetailsArray[i].state == loanState.successful &&
                num == 3
            ) {
                borrowerDetailsArray[i].state = loanState.Repaid;
                return true;
            }
            if (
                borrowerDetailsArray[i].AddressofBorrower == _address &&
                borrowerDetailsArray[i].state == loanState.successful &&
                num == 4
            ) {
                borrowerDetailsArray[i].state = loanState.liquidated;
                return true;
            }
        }
    }

    /**
     * getter functions
     *
     * Interest is provided on monthly basis but is calculated on hourly basis*/
    function _getRepayAmount(
        uint256 _rate,
        uint256 _amounttoPay,
        uint256 _hours
    ) internal pure returns (uint256) {
        uint256 interest = (_rate * _hours * _amounttoPay) / 72000;
        uint256 amount = interest + _amounttoPay;
        return amount;
    }

    function getRepayAmount(uint256 _LoanId) external view returns (uint256) {
        Borrower storage borrower = BorrowerInfoMap[msg.sender][_LoanId];
        if (borrower.state != loanState.successful) {
            revert InvalidLoan();
        }
        uint Hours = TimeStampHelper.getHour(block.timestamp, borrower.Dayspassed);
        if (Hours >= 24) {
            uint256 value = _getRepayAmount(borrower.rate, borrower.amount, Hours);

            return value;
        } else {
            revert waitForOneDay();
        }
    }

    function displayBorrowerLoans(
        uint256 _loanId
    )
        public
        view
        returns (uint256, uint256, uint256, loanState, uint256, string memory, uint256, uint256)
    {
        Borrower storage borrower = BorrowerInfoMap[msg.sender][_loanId];

        return (
            borrower.loanId,
            borrower.amount,
            borrower.collateral,
            borrower.state,
            borrower.proposalCount,
            borrower.paymentDate,
            borrower.Dayspassed,
            borrower.rate
        );
    }

    function hasActiveLoans(address borrower) public view returns (bool) {
        for (uint256 i = 0; i < countLoans(); i++) {
            loanState state = BorrowerInfoMap[borrower][i].state;
            if (
                state == loanState.accepting ||
                state == loanState.awaitingFinalAcceptance ||
                state == loanState.accepted
            ) {
                return true;
            }
        }
        return false;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) external view override returns (bytes4) {
        operator;
        from;
        tokenId;
        data;
        return IERC721Receiver(msg.sender).onERC721Received.selector;
    }

    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getAllBorrowerDetails() public view returns (borrowerDetails[] memory) {
        return borrowerDetailsArray;
    }

    function displayBorrowerDetails(
        uint index
    ) public view returns (uint256, address, uint256, uint256, loanState, string memory) {
        // Ensure that the index is within the bounds of the array
        require(index < borrowerDetailsArray.length, "Index out of bounds");

        // Retrieve the borrower details at the specified index
        borrowerDetails memory borrower = borrowerDetailsArray[index];

        // Return the borrower details
        return (
            borrower.loanId,
            borrower.AddressofBorrower,
            borrower.amount,
            borrower.collateral,
            borrower.state,
            borrower.paymentDate
        );
    }

    function getAllActiveProposals(
        uint256 index
    ) public view returns (address, uint256, uint256, uint256) {
        // Check that the index is within bounds
        require(index < LenderProposalArray.length, "Index out of bounds");

        // Get the lender proposal at the specified index
        LenderProposal memory lenderProposal = LenderProposalArray[index];
        if (
            msg.sender == lenderProposal.AddressofBorrower &&
            lenderProposal.state == proposalState.waiting
        ) {
            // Return the lender, loan ID, amount, and rate for the proposal
            return (
                lenderProposal.Lender,
                lenderProposal.loanId,
                lenderProposal.amount,
                lenderProposal.rate
            );
        } else {
            // Add an explicit return with a default value for the case where the sender is not the borrower
            return (address(0), 0, 0, 0);
        }
    }

    function getMyProposals(
        uint256 index
    ) public view returns (address, uint256, uint256, string memory, proposalState, uint256) {
        // Check that the index is within bounds
        require(index < LenderProposalArray.length, "Index out of bounds");
        LenderProposal memory lenderProposal = LenderProposalArray[index];
        if (msg.sender == lenderProposal.Lender) {
            string storage dueDate = BorrowerInfoMap[lenderProposal.AddressofBorrower][
                lenderProposal.loanId
            ].paymentDate;

            return (
                lenderProposal.AddressofBorrower,
                lenderProposal.amount,
                lenderProposal.rate,
                dueDate,
                lenderProposal.state,
                lenderProposal.loanId
            );
        } else {
            // Add an explicit return with a default value for the case where the sender is not the borrower
            return (address(0), 0, 0, "0", proposalState.waiting, 0);
        }
    }

    function getActiveProposalsLength() public view returns (uint256) {
        return LenderProposalArray.length;
    }

    function countLoans() public view returns (uint256) {
        uint256 Num = BorrowerLoanCountMap[msg.sender];
        return Num;
    }

    function getLoanCount() public view returns (uint256) {
        return borrowerDetailsArray.length;
    }

    function getCurrentTimeStamp() public view returns (uint) {
        return block.timestamp;
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}
