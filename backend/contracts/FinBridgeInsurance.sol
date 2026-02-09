// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FinBridge Insurance Pool
 * @dev Insurance contract for loan protection and risk management
 */
contract FinBridgeInsurance is ReentrancyGuard, Ownable {
    
    struct InsurancePolicy {
        uint256 id;
        address insured;
        uint256 loanAmount;
        uint256 premium;
        uint256 coverageAmount;
        uint256 duration;
        uint256 startTime;
        bool isActive;
        bool claimProcessed;
    }
    
    mapping(uint256 => InsurancePolicy) public policies;
    mapping(address => uint256[]) public userPolicies;
    uint256 public nextPolicyId = 1;
    
    uint256 public constant PREMIUM_RATE = 50; // 0.5% premium in basis points
    uint256 public constant COVERAGE_MULTIPLIER = 1000; // 10x coverage
    
    event PolicyCreated(uint256 indexed policyId, address indexed insured, uint256 coverageAmount);
    event ClaimProcessed(uint256 indexed policyId, address indexed insured, uint256 payoutAmount);
    
    function createInsurancePolicy(uint256 loanAmount, uint256 duration) external payable nonReentrant {
        require(msg.value >= 0.01 ether, "Minimum premium is 0.01 ETH");
        require(loanAmount > 0, "Loan amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        
        uint256 premium = msg.value;
        uint256 coverageAmount = (loanAmount * COVERAGE_MULTIPLIER) / 1000;
        
        uint256 policyId = nextPolicyId++;
        
        policies[policyId] = InsurancePolicy({
            id: policyId,
            insured: msg.sender,
            loanAmount: loanAmount,
            premium: premium,
            coverageAmount: coverageAmount,
            duration: duration,
            startTime: block.timestamp,
            isActive: true,
            claimProcessed: false
        });
        
        userPolicies[msg.sender].push(policyId);
        
        emit PolicyCreated(policyId, msg.sender, coverageAmount);
    }
    
    function processClaim(uint256 policyId) external onlyOwner nonReentrant {
        require(policies[policyId].isActive, "Policy is not active");
        require(!policies[policyId].claimProcessed, "Claim already processed");
        
        InsurancePolicy storage policy = policies[policyId];
        policy.isActive = false;
        policy.claimProcessed = true;
        
        uint256 payoutAmount = policy.coverageAmount;
        
        (bool success, ) = policy.insured.call{value: payoutAmount}("");
        require(success, "Claim payout failed");
        
        emit ClaimProcessed(policyId, policy.insured, payoutAmount);
    }
    
    function getPolicy(uint256 policyId) external view returns (InsurancePolicy memory) {
        return policies[policyId];
    }
    
    function getUserPolicies(address user) external view returns (uint256[] memory) {
        return userPolicies[user];
    }
    
    function getInsurancePool() external view returns (uint256) {
        return address(this).balance;
    }
}
