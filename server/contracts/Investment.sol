// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title Investment
 * @dev Smart contract for handling investments between investors and startups
 */
contract Investment {
    address public owner;
    
    struct Startup {
        address wallet;
        uint256 fundingGoal;
        uint256 currentFunding;
        bool active;
    }
    
    struct InvestmentRecord {
        address investor;
        address startup;
        uint256 amount;
        uint256 timestamp;
    }
    
    // Mapping of startup addresses to their details
    mapping(address => Startup) public startups;
    
    // Array of all investments
    InvestmentRecord[] public investments;
    
    // Events
    event StartupRegistered(address indexed wallet, uint256 fundingGoal);
    event InvestmentMade(address indexed investor, address indexed startup, uint256 amount);
    event FundsWithdrawn(address indexed startup, address indexed to, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function");
        _;
    }
    
    /**
     * @dev Register a new startup
     * @param startupAddress The Ethereum address of the startup
     * @param fundingGoal The funding goal in wei
     */
    function registerStartup(address startupAddress, uint256 fundingGoal) public onlyOwner {
        require(startupAddress != address(0), "Invalid startup address");
        require(fundingGoal > 0, "Funding goal must be greater than 0");
        require(!startups[startupAddress].active, "Startup already registered");
        
        startups[startupAddress] = Startup({
            wallet: startupAddress,
            fundingGoal: fundingGoal,
            currentFunding: 0,
            active: true
        });
        
        emit StartupRegistered(startupAddress, fundingGoal);
    }
    
    /**
     * @dev Make an investment in a startup
     * @param startupAddress The Ethereum address of the startup
     */
    function invest(address startupAddress) public payable {
        require(msg.value > 0, "Investment amount must be greater than 0");
        require(startups[startupAddress].active, "Startup not found or not active");
        
        Startup storage startup = startups[startupAddress];
        startup.currentFunding += msg.value;
        
        investments.push(InvestmentRecord({
            investor: msg.sender,
            startup: startupAddress,
            amount: msg.value,
            timestamp: block.timestamp
        }));
        
        emit InvestmentMade(msg.sender, startupAddress, msg.value);
    }
    
    /**
     * @dev Withdraw funds for a startup
     * @param amount The amount to withdraw
     */
    function withdrawFunds(uint256 amount) public {
        require(startups[msg.sender].active, "Only registered startups can withdraw funds");
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(amount <= startups[msg.sender].currentFunding, "Insufficient funds");
        
        Startup storage startup = startups[msg.sender];
        startup.currentFunding -= amount;
        
        payable(msg.sender).transfer(amount);
        
        emit FundsWithdrawn(msg.sender, msg.sender, amount);
    }
    
    /**
     * @dev Get startup details
     * @param startupAddress The Ethereum address of the startup
     * @return wallet The wallet address of the startup
     * @return fundingGoal The funding goal of the startup
     * @return currentFunding The current funding amount of the startup
     * @return active Whether the startup is active
     */
    function getStartup(address startupAddress) public view returns (
        address wallet,
        uint256 fundingGoal,
        uint256 currentFunding,
        bool active
    ) {
        Startup memory startup = startups[startupAddress];
        return (
            startup.wallet,
            startup.fundingGoal,
            startup.currentFunding,
            startup.active
        );
    }
    
    /**
     * @dev Get the number of investments
     * @return The total number of investments
     */
    function getInvestmentCount() public view returns (uint256) {
        return investments.length;
    }
    
    /**
     * @dev Get investments for a specific investor
     * @param investor The address of the investor
     * @return An array of investment indices
     */
    function getInvestorInvestments(address investor) public view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count the number of investments for this investor
        for (uint256 i = 0; i < investments.length; i++) {
            if (investments[i].investor == investor) {
                count++;
            }
        }
        
        // Create an array of the right size
        uint256[] memory result = new uint256[](count);
        
        // Fill the array with investment indices
        uint256 index = 0;
        for (uint256 i = 0; i < investments.length; i++) {
            if (investments[i].investor == investor) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get investments for a specific startup
     * @param startupAddress The address of the startup
     * @return An array of investment indices
     */
    function getStartupInvestments(address startupAddress) public view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count the number of investments for this startup
        for (uint256 i = 0; i < investments.length; i++) {
            if (investments[i].startup == startupAddress) {
                count++;
            }
        }
        
        // Create an array of the right size
        uint256[] memory result = new uint256[](count);
        
        // Fill the array with investment indices
        uint256 index = 0;
        for (uint256 i = 0; i < investments.length; i++) {
            if (investments[i].startup == startupAddress) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
}
