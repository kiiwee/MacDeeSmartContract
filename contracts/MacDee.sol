//SPDX-License-Identifier: MIT
pragma solidity >=0.8;
import "hardhat/console.sol";

//TODO CANNOT CHANGE MARGIN ON EXISTING PAST TRANSACTION
//WORKERS
//CHANGE PAY

//SUPPLIERS
//CHANGE PAY
//ADMIN
//DEPOSIT COMPANY FUNDS
//MANAGER ACCOUNT
//REFRACTOR CONTRACT INTO, WORKERS SUPPLIERS MANAGER AND ADMIN

contract MacDeeContract {
    address private companyAcc;
    uint256 public companyBalance;
    uint256 public totalSuppliers = 0;
    uint256 public totalSuppliersPayment = 0;
    uint256 public totalPayment = 0;
    uint256 public mealPrice = 0;
    uint256 private companyMargin = 1_000_000_00;
    uint256 private transactionsPayedOwner = 0;
    uint256 private transactionNumber;
    event workerClockInEvent(address indexed owner, uint256 time);
    event workerClockOutEvent(address indexed owner, uint256 time);
    event workerWithdrawEvent(address indexed owner, uint256 amount);
    event supplierWithdrawEvent(address indexed owner, uint256 amount);
    event paymentForMealEcent(address indexed owner, uint256);
    //Suppliers
    mapping(address => bool) isSupplier;
    mapping(address => uint256) supplierTransactionsPayed;
    mapping(address => uint256) supplierPaymentAmount;
    // Workers
    mapping(address => bool) isWorker;
    mapping(address => uint256) workerPaymentAmout;
    mapping(address => uint256) workerPaymentPerSecond;
    mapping(address => uint) workerCardMap;
    mapping(address => bool) isWorking;
    mapping(address => uint256) workerStartTime;

    constructor(uint256 amountMeal, uint256 profitmargin) {
        companyAcc = msg.sender;
        mealPrice = amountMeal;
        companyMargin = profitmargin;
    }

    modifier ownerOnly() {
        require(msg.sender == companyAcc, "Owner reserved only");
        _;
    }
    modifier supplierOnly() {
        require(isSupplier[msg.sender], "Supplier only");
        _;
    }
    modifier workerOnly() {
        require(isWorker[msg.sender], "Workers only");
        _;
    }

    function workerQuit() external workerOnly {
        require(
            workerPaymentAmout[msg.sender] == 0,
            "You still have money in the contract"
        );
        isWorker[msg.sender] = false;
    }

    function removeWorker(address worker) external ownerOnly {
        require(isWorker[worker], "Not working");
        require(
            workerPaymentAmout[worker] == 0,
            "Worker still has money in the contract"
        );
        isWorker[worker] = false;
    }

    function addWorker(
        address worker,
        uint256 paypersecond
    ) external ownerOnly {
        require(!isWorker[worker], "Worker already added");
        require(paypersecond > 0, "Pay must be higher than 0");
        isWorker[worker] = true;
        workerPaymentPerSecond[worker] = paypersecond;
        isWorking[worker] = false;
    }

    function workerClockIn() external workerOnly {
        require(!isWorking[msg.sender], "Already working");
        workerStartTime[msg.sender] = block.timestamp;
        isWorking[msg.sender] = true;
        emit workerClockInEvent(msg.sender, block.timestamp);
    }

    function workerClockOut() external workerOnly {
        require(isWorking[msg.sender], "Not working");
        isWorking[msg.sender] = false;
        uint toPay = block.timestamp - workerStartTime[msg.sender];
        workerPaymentAmout[msg.sender] =
            workerPaymentAmout[msg.sender] +
            (toPay * workerPaymentPerSecond[msg.sender]);
        workerStartTime[msg.sender] = 0;
        emit workerClockOutEvent(msg.sender, block.timestamp);
    }

    function workerWithdralAll() external workerOnly returns (int) {
        uint256 toSend = workerPaymentAmout[msg.sender];
        require(workerPaymentAmout[msg.sender] > 0, "Nothing to withdraw");
        workerPaymentAmout[msg.sender] = 0;
        payTo(msg.sender, toSend);
        emit workerWithdrawEvent(msg.sender, toSend);
        return 1;
    }

    function withdrawCompanyFunds() external ownerOnly {
        uint256 toSend = (transactionNumber - transactionsPayedOwner) *
            companyMargin;
        require(toSend > 0, "Nothing to withdraw");
        transactionsPayedOwner = transactionNumber;
        payTo(companyAcc, toSend);
    }

    function getSupplierBalance() public view supplierOnly returns (uint256) {
        uint256 toSend = (transactionNumber -
            supplierTransactionsPayed[msg.sender]) *
            supplierPaymentAmount[msg.sender];
        return toSend;
    }

    function supplierWithdrawAll() external supplierOnly returns (uint256) {
        uint256 toSend = (transactionNumber -
            supplierTransactionsPayed[msg.sender]) *
            supplierPaymentAmount[msg.sender];
        require(toSend > 0, "Nothing to withdraw");
        supplierTransactionsPayed[msg.sender] = transactionNumber;
        payTo(msg.sender, toSend);
        return toSend;
    }

    function removeSupplier(
        address supplier
    ) external ownerOnly returns (address) {
        require(isSupplier[supplier], "Record doesnt exist");
        require(
            supplierTransactionsPayed[supplier] == transactionNumber,
            "The supplier still has money in the contract"
        );
        isSupplier[supplier] = false;
        totalSuppliers--;
        totalSuppliersPayment -= supplierPaymentAmount[supplier];
        return supplier;
    }

    function addSupplier(
        address supplier,
        uint256 amount
    ) external ownerOnly returns (bool) {
        require(amount > 0, "Amount cannot be zero!");
        require(!isSupplier[supplier], "Record already existing!");

        totalSuppliers++;
        totalSuppliersPayment += amount;
        isSupplier[supplier] = true;
        supplierTransactionsPayed[supplier] = transactionNumber;
        supplierPaymentAmount[supplier] = amount;
        return true;
    }

    function payForMeal() public payable {
        require(msg.value == mealPrice, "Paying too much or too little");
        transactionNumber++;
    }

    function donate() public payable {
        (bool success, ) = companyAcc.call{value: msg.value}("");
        require(success, "Failed to send money");
    }

    function payTo(address to, uint256 amount) internal returns (bool) {
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Payment failed");
        return true;
    }

    function getOwner() external view returns (address) {
        return companyAcc;
    }

    function getBalance() external view returns (uint256) {
        return companyBalance;
    }

    function setMealPrice(uint256 amount) external ownerOnly returns (uint256) {
        require(amount > 0, "amount has to be above 0");
        mealPrice = amount;
        return mealPrice;
    }

    function setCompanyMargin(
        uint256 amount
    ) external ownerOnly returns (uint256) {
        require(amount > 0, "amount has to be above 0");
        companyMargin = amount;
        return companyMargin;
    }
}
