// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FinBridge Yield Farming
 * @dev Yield farming protocol for liquidity providers
 */
contract FinBridgeYieldFarming is ReentrancyGuard, Ownable {
    
    struct Farm {
        uint256 id;
        address farmer;
        uint256 lpTokenAmount;
        uint256 rewardDebt;
        uint256 lastHarvestTime;
        bool isActive;
        uint256 createdAt;
    }
    
    struct PoolInfo {
        address lpToken;
        uint256 allocPoint;
        uint256 lastRewardTime;
        uint256 accRewardPerShare;
        uint256 totalLpSupply;
    }
    
    mapping(uint256 => PoolInfo) public poolInfo;
    mapping(uint256 => Farm) public farms;
    mapping(address => uint256) public userFarmCount;
    
    uint256 public constant REWARD_PER_SECOND = 1000000000000000000; // 0.000001 FBR per second
    uint256 public constant BONUS_MULTIPLIER = 2; // 2x bonus for early farmers
    
    uint256 public nextFarmId = 1;
    uint256 public nextPoolId = 1;
    
    event FarmCreated(uint256 indexed farmId, address indexed farmer, uint256 lpAmount);
    event Harvested(address indexed farmer, uint256 farmId, uint256 rewardAmount);
    
    function addPool(address lpToken, uint256 allocPoint) external onlyOwner {
        poolInfo[nextPoolId] = PoolInfo({
            lpToken: lpToken,
            allocPoint: allocPoint,
            lastRewardTime: block.timestamp,
            accRewardPerShare: 0,
            totalLpSupply: 0
        });
        
        nextPoolId++;
    }
    
    function createFarm(uint256 poolId, uint256 lpAmount) external nonReentrant {
        require(poolId < nextPoolId, "Invalid pool ID");
        require(lpAmount > 0, "LP amount must be greater than 0");
        
        PoolInfo storage pool = poolInfo[poolId];
        
        farms[nextFarmId] = Farm({
            id: nextFarmId,
            farmer: msg.sender,
            lpTokenAmount: lpAmount,
            rewardDebt: 0,
            lastHarvestTime: block.timestamp,
            isActive: true,
            createdAt: block.timestamp
        });
        
        userFarmCount[msg.sender]++;
        pool.totalLpSupply += lpAmount;
        
        emit FarmCreated(nextFarmId, msg.sender, lpAmount);
        nextFarmId++;
    }
    
    function harvest(uint256 farmId) external nonReentrant {
        require(farms[farmId].isActive, "Farm not found");
        require(farms[farmId].farmer == msg.sender, "Not your farm");
        
        Farm storage farm = farms[farmId];
        PoolInfo storage pool = poolInfo[farmId];
        
        uint256 pendingReward = calculatePendingReward(farmId, msg.sender);
        
        if (pendingReward > 0) {
            farm.rewardDebt = pendingReward;
            farm.lastHarvestTime = block.timestamp;
            
            (bool success, ) = msg.sender.call{value: pendingReward}("");
            require(success, "Transfer failed");
            
            emit Harvested(msg.sender, farmId, pendingReward);
        }
    }
    
    function calculatePendingReward(uint256 farmId, address user) internal view returns (uint256) {
        if (!farms[farmId].isActive) return 0;
        
        Farm storage farm = farms[farmId];
        PoolInfo storage pool = poolInfo[farmId];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        if (pool.totalLpSupply > 0) {
            accRewardPerShare += ((block.timestamp - pool.lastRewardTime) * REWARD_PER_SECOND * pool.allocPoint) / pool.totalLpSupply;
        }
        
        return (farm.lpTokenAmount * accRewardPerShare / 1e18) - farm.rewardDebt;
    }
    
    function getFarm(uint256 farmId) external view returns (Farm memory) {
        return farms[farmId];
    }
    
    function getPendingReward(uint256 farmId, address user) external view returns (uint256) {
        return calculatePendingReward(farmId, user);
    }
    
    function getPoolInfo(uint256 poolId) external view returns (PoolInfo memory) {
        return poolInfo[poolId];
    }
}
