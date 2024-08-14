// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
error notOwner();
error notInvestor();
error notCorrectName();

contract RegistarInvestor {
    address private immutable i_owner;

    constructor() {
        i_owner = msg.sender;
    }

    struct InvestorDetails {
        string OrganisationName;
        address InvestorAddress;
        string RegistrationDate;
        string RegistrationTime;
    }

    struct InvestorRegNumAndName {
        string OrganisationName;
        uint256 OrganisationRegNum;
    }
    mapping(uint256 => InvestorDetails) private InvestorInfoMap;

    InvestorRegNumAndName[] private InvestorInfoArray;

    mapping(string => bool) private Employee_userName;
    mapping(address => bool) private Employee_address;

    function addInvestorData(
        string memory _OrganisationName,
        address _InvestorAddress,
        uint256 _ResistrationNumber,
        string memory _ResistrationDate,
        string memory _ResistrationTime
    ) public onlyOwner {
        InvestorInfoMap[_ResistrationNumber].OrganisationName = _OrganisationName;
        InvestorInfoMap[_ResistrationNumber].InvestorAddress = _InvestorAddress;
        InvestorInfoMap[_ResistrationNumber].RegistrationDate = _ResistrationDate;
        InvestorInfoMap[_ResistrationNumber].RegistrationTime = _ResistrationTime;

        InvestorInfoArray.push(InvestorRegNumAndName(_OrganisationName, _ResistrationNumber));
    }

    struct EmployeeInfo {
        string EmployeeName;
        address EmployeeAddress;
    }
    EmployeeInfo[] public EmployeeInfoArray;

    mapping(string => EmployeeInfo[]) public EmployeeInfoMap;

    function addEmployee(
        string memory _OrganisationName,
        uint256 _ResistrationNumber,
        string memory _EmployeeName,
        address _EmployeeAddress
    ) public {
        if (msg.sender != InvestorInfoMap[_ResistrationNumber].InvestorAddress) {
            revert notInvestor();
        }

        // string memory Organisationname = InvestorInfoMap[_ResistrationNumber].OrganisationName;
        if (
            keccak256(abi.encodePacked(InvestorInfoMap[_ResistrationNumber].OrganisationName)) !=
            keccak256(abi.encodePacked(_OrganisationName))
        ) {
            // do something here...
            revert notCorrectName();
        }

        Employee_userName[_EmployeeName] = true;
        Employee_address[_EmployeeAddress] = true;

        EmployeeInfoArray.push(EmployeeInfo(_EmployeeName, _EmployeeAddress));

        EmployeeInfoMap[_OrganisationName].push(EmployeeInfo(_EmployeeName, _EmployeeAddress));
    }

    function checkConsumer(
        string memory _Employee_userName,
        address _Employee_address
    ) public view returns (bool valid) {
        bool validUserName = Employee_userName[_Employee_userName];
        bool validAddress = Employee_address[_Employee_address];

        valid = (validUserName && validAddress);

        return (valid);
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) revert notOwner();

        _;
    }

    string private greeting = "hellooooo";

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }

    function getInvestorData(
        uint256 _ResistrationNumber
    ) public view returns (string memory, address, string memory, string memory) {
        InvestorDetails memory p = InvestorInfoMap[_ResistrationNumber];

        return (p.OrganisationName, p.InvestorAddress, p.RegistrationDate, p.RegistrationTime);
    }
}
