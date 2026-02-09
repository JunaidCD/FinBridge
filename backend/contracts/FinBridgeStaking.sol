// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FinBridge Staking
 * @dev Staking mechanism for FBR tokens and platform rewards
 */
contract FinBridgeStaking is ReentrancyGuard, Ownable {
    
    struct Stake {
        address staker;
        uint256 amount;
        uint256 stakingPeriod;
        uint256 rewardsEarned;
        uint256 lastRewardTime;
        bool isActive;
        uint256 stakedAt;
    }
    
    mapping(address => Stake) public stakes;
    mapping(address => uint256) public totalStaked;
    uint256 public totalStakedAmount;
    
    uint256 public constant REWARD_RATE = 100; // 1% annual reward in basis points
    uint256 public constant MIN_STAKE_AMOUNT = 0.01 ether;
    uint256 public constant MAX_STAKE_AMOUNT = 1000 ether;
    uint256 public constant SECONDS_PER_YEAR = 31536000;
    
    event TokensStaked(address indexed staker, uint256 amount, uint256 period);
    event RewardsClaimed(address indexed staker, uint256 amount);
    event TokensUnstaked(address indexed staker, uint256 amount);
    
    function stakeTokens(uint256 amount, uint256 stakingPeriod) external payable nonReentrant {
        require(msg.value == amount, "ETH amount must match staking amount");
        require(amount >= MIN_STAKE_AMOUNT && amount <= MAX_STAKE_AMOUNT, "Invalid staking amount");
        require(stakingPeriod > 0, "Staking period must be greater than 0");
        
        uint256 stakingPeriodInSeconds = stakingPeriod * 30 days; // Convert months to seconds
        
        stakes[msg.sender] = Stake({
            staker: msg.sender,
            amount: amount,
            stakingPeriod: stakingPeriodInSeconds,
            rewardsEarned: 0,
            lastRewardTime: block.timestamp,
            isActive: true,
            stakedAt: block.timestamp
        });
        
        totalStaked[msg.sender] += amount;
        totalStakedAmount += amount;
        
        emit TokensStaked(msg.sender, amount, stakingPeriodInSeconds);
    }
    
    function unstakeTokens() external nonReentrant {
        require(stakes[msg.sender].isActive, "No active stake found");
        require(block.timestamp >= stakes[msg.sender].stakedAt + stakes[msg.sender].stakingPeriod, "Staking period not completed");
        
        Stake storage userStake = stakes[msg.sender];
        uint256 rewards = calculateRewards(msg.sender);
        
        userStake.isActive = false;
        totalStaked[msg.sender] -= userStake.amount;
        totalStakedAmount -= userStake.amount;
        
        (bool success, ) = msg.sender.call{value: userStake.amount + rewards}("");
        require(success, "Transfer failed");
        
        emit TokensUnstaked(msg.sender, userStake.amount);
        if (rewards > 0) {
            emit RewardsClaimed(msg.sender, rewards);
        }
    }
    
    function claimRewards() external nonReentrant {
        require(stakes[msg.sender].isActive, "No active stake found");
        
        uint256 rewards = calculateRewards(msg.sender);
        
        if (rewards > 0) {
            stakes[msg.sender].rewardsEarned += rewards;
            stakes[msg.sender].lastRewardTime = block.timestamp;
            
            (bool success, ) = msg.sender.call{value: rewards}("");
            require(success, "Transfer failed");
            
            emit RewardsClaimed(msg.sender, rewards);
        }
    }
    
    function calculateRewards(address staker) internal view returns (uint256) {
        if (!stakes[staker].isActive) return 0;
        
        Stake storage userStake = stakes[staker];
        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        uint256 annualReward = (userStake.amount * REWARD_RATE) / 10000;
        uint256 rewards = (annualReward * timeElapsed) / SECONDS_PER_YEAR;
        
        return rewards;
    }
    
    function getStake(address staker) external view returns (Stake memory) {
        return stakes[staker];
    }
    
    function getPendingRewards(address staker) external view returns (uint256) {
        return calculateRewards(staker);
    }
    
    function getTotalStaked() external view returns (uint256) {
        return totalStakedAmount;
    }
}
