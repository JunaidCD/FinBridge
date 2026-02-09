// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FinBridge Analytics
 * @dev Analytics and data tracking for the lending platform
 */
contract FinBridgeAnalytics is ReentrancyGuard, Ownable {
    
    struct PlatformMetrics {
        uint256 totalLoansCreated;
        uint256 totalAmountBorrowed;
        uint256 totalAmountLent;
        uint256 activeUsers;
        uint256 totalInterestPaid;
        uint256 averageLoanAmount;
        uint256 averageLoanDuration;
        uint256 platformRevenue;
        uint256 lastUpdated;
    }
    
    struct DailyStats {
        uint256 date;
        uint256 newLoans;
        uint256 totalVolume;
        uint256 newUsers;
        uint256 activeLoans;
    }
    
    PlatformMetrics public metrics;
    mapping(uint256 => DailyStats) public dailyStats;
    mapping(address => uint256) public userFirstLoan;
    mapping(address => uint256) public userLastActivity;
    
    uint256 public constant SECONDS_PER_DAY = 86400;
    
    event MetricsUpdated(uint256 totalLoans, uint256 totalVolume, uint256 activeUsers);
    event DailyStatsRecorded(uint256 date, uint256 newLoans, uint256 totalVolume);
    
    constructor() {
        metrics = PlatformMetrics({
            totalLoansCreated: 0,
            totalAmountBorrowed: 0,
            totalAmountLent: 0,
            activeUsers: 0,
            totalInterestPaid: 0,
            averageLoanAmount: 0,
            averageLoanDuration: 0,
            platformRevenue: 0,
            lastUpdated: block.timestamp
        });
    }
    
    function recordLoanCreation(uint256 amount, address borrower) external {
        metrics.totalLoansCreated++;
        metrics.totalAmountBorrowed += amount;
        
        // Update averages
        metrics.averageLoanAmount = metrics.totalAmountBorrowed / metrics.totalLoansCreated;
        
        // Track first-time users
        if (userFirstLoan[borrower] == 0) {
            metrics.activeUsers++;
            userFirstLoan[borrower] = 1;
        }
        
        userLastActivity[borrower] = block.timestamp;
        metrics.lastUpdated = block.timestamp;
        
        _recordDailyStats(amount, borrower, true);
        
        emit MetricsUpdated(metrics.totalLoansCreated, metrics.totalAmountBorrowed, metrics.activeUsers);
    }
    
    function recordLoanFunding(uint256 amount, address lender) external {
        metrics.totalAmountLent += amount;
        userLastActivity[lender] = block.timestamp;
        metrics.lastUpdated = block.timestamp;
        
        _recordDailyStats(amount, lender, false);
    }
    
    function recordInterestPayment(uint256 interestAmount) external {
        metrics.totalInterestPaid += interestAmount;
        metrics.platformRevenue += interestAmount;
        metrics.lastUpdated = block.timestamp;
    }
    
    function _recordDailyStats(uint256 amount, address user, bool isNewLoan) internal {
        uint256 today = (block.timestamp / SECONDS_PER_DAY) * SECONDS_PER_DAY;
        
        if (dailyStats[today].date != today) {
            dailyStats[today] = DailyStats({
                date: today,
                newLoans: 0,
                totalVolume: 0,
                newUsers: 0,
                activeLoans: 0
            });
        }
        
        if (isNewLoan) {
            dailyStats[today].newLoans++;
            if (userFirstLoan[user] == 0) {
                dailyStats[today].newUsers++;
            }
        }
        
        dailyStats[today].totalVolume += amount;
        dailyStats[today].activeLoans++;
        
        emit DailyStatsRecorded(today, dailyStats[today].newLoans, dailyStats[today].totalVolume);
    }
    
    function getMetrics() external view returns (PlatformMetrics memory) {
        return metrics;
    }
    
    function getDailyStats(uint256 date) external view returns (DailyStats memory) {
        return dailyStats[date];
    }
    
    function getUserStats(address user) external view returns (uint256 firstLoan, uint256 lastActivity) {
        return (userFirstLoan[user], userLastActivity[user]);
    }
}
