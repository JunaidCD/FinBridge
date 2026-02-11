// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title FinBridgeToken
 * @dev Advanced ERC20 token with governance features, staking integration, and vesting
 * @notice Native utility token for FinBridge DeFi lending platform
 */
contract FinBridgeToken is Context, IERC20, IERC20Metadata, Ownable, Pausable {
    
    // Token metadata
    string private _name = "FinBridge Token";
    string private _symbol = "FBR";
    uint8 private _decimals = 18;
    uint256 private _totalSupply;
    
    // Balances and allowances
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Governance features
    mapping(address => uint256) public delegatedVotes;
    mapping(address => address) public delegates;
    mapping(bytes32 => uint256) public proposalVotes;
    
    // Vesting schedules
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliffDuration;
        bool revocable;
        bool revoked;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    address[] public vestingBeneficiaries;
    
    // Staking integration
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingStartTime;
    uint256 public totalStaked;
    uint256 public constant REWARD_RATE = 100; // 10% annual reward rate
    
    // Token distribution
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100 million tokens
    uint256 public constant TEAM_ALLOCATION = 15_000_000 * 10**18; // 15% team
    uint256 public constant COMMUNITY_ALLOCATION = 40_000_000 * 10**18; // 40% community
    uint256 public constant LENDING_REWARDS = 25_000_000 * 10**18; // 25% lending rewards
    uint256 public constant TREASURY_ALLOCATION = 20_000_000 * 10**18; // 20% treasury
    
    // Events
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 rewards);
    
    constructor() Ownable() {
        // Initial supply distribution
        _mint(msg.sender, TREASURY_ALLOCATION); // Treasury initially holds 20%
    }
    
    /**
     * @dev Returns the name of the token
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }
    
    /**
     * @dev Returns the symbol of the token
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }
    
    /**
     * @dev Returns the number of decimals used to display token amounts
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Returns the total supply of tokens
     */
    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }
    
    /**
     * @dev Returns the balance of the specified account
     */
    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }
    
    /**
     * @dev Transfers tokens to a specified address
     */
    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }
    
    /**
     * @dev Returns the remaining number of tokens that spender will be allowed to spend
     */
    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    /**
     * @dev Sets the amount of allowance that spender is allowed to spend
     */
    function approve(address spender, uint256 amount) public virtual override whenNotPaused returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }
    
    /**
     * @dev Transfers tokens from one address to another using the allowance mechanism
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }
    
    /**
     * @dev Increases the allowance granted to spender by the caller
     */
    function increaseAllowance(address spender, uint256 addedValue) public virtual whenNotPaused returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, allowance(owner, spender) + addedValue);
        return true;
    }
    
    /**
     * @dev Decreases the allowance granted to spender by the caller
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual whenNotPaused returns (bool) {
        address owner = _msgSender();
        uint256 currentAllowance = allowance(owner, spender);
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(owner, spender, currentAllowance - subtractedValue);
        }
        return true;
    }
    
    /**
     * @dev Mints new tokens to the specified address
     * @notice Only callable by owner, limited by MAX_SUPPLY
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(_totalSupply + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
    
    /**
     * @dev Burns tokens from the caller's account
     */
    function burn(uint256 amount) public virtual whenNotPaused {
        _burn(_msgSender(), amount);
    }
    
    /**
     * @dev Burns tokens from the specified account using allowance
     */
    function burnFrom(address account, uint256 amount) public virtual whenNotPaused {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }
    
    /**
     * @dev Internal transfer function
     */
    function _transfer(address from, address to, uint256 amount) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        
        _beforeTokenTransfer(from, to, amount);
        
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }
        
        emit Transfer(from, to, amount);
        
        _afterTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Internal mint function
     */
    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");
        
        _beforeTokenTransfer(address(0), account, amount);
        
        _totalSupply += amount;
        unchecked {
            _balances[account] += amount;
        }
        emit Transfer(address(0), account, amount);
        
        _afterTokenTransfer(address(0), account, amount);
    }
    
    /**
     * @dev Internal burn function
     */
    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");
        
        _beforeTokenTransfer(account, address(0), amount);
        
        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
            _totalSupply -= amount;
        }
        
        emit Transfer(account, address(0), amount);
        
        _afterTokenTransfer(account, address(0), amount);
    }
    
    /**
     * @dev Internal approve function
     */
    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
    
    /**
     * @dev Internal spend allowance function
     */
    function _spendAllowance(address owner, address spender, uint256 amount) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
    
    /**
     * @dev Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual { }
    
    /**
     * @dev Hook that is called after any transfer of tokens
     */
    function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual { }
    
    // ==================== VESTING FUNCTIONALITY ====================
    
    /**
     * @dev Creates a vesting schedule for a beneficiary
     * @param beneficiary Address to receive vested tokens
     * @param amount Total amount to vest
     * @param duration Total vesting duration in seconds
     * @param cliffDuration Cliff period before any tokens are released
     * @param revocable Whether the vesting can be revoked by owner
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 duration,
        uint256 cliffDuration,
        bool revocable
    ) external onlyOwner {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(cliffDuration <= duration, "Cliff cannot exceed duration");
        require(vestingSchedules[beneficiary].totalAmount == 0, "Vesting already exists");
        
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            duration: duration,
            cliffDuration: cliffDuration,
            revocable: revocable,
            revoked: false
        });
        
        vestingBeneficiaries.push(beneficiary);
        
        // Transfer tokens to contract for vesting
        _transfer(_msgSender(), address(this), amount);
        
        emit VestingScheduleCreated(beneficiary, amount, duration);
    }
    
    /**
     * @dev Calculates the releasable amount for a beneficiary
     */
    function releasableAmount(address beneficiary) public view returns (uint256) {
        return vestedAmount(beneficiary) - vestingSchedules[beneficiary].releasedAmount;
    }
    
    /**
     * @dev Calculates the total vested amount for a beneficiary
     */
    function vestedAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        
        if (schedule.totalAmount == 0 || schedule.revoked) {
            return 0;
        }
        
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0; // Before cliff
        }
        
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount; // Fully vested
        }
        
        // Linear vesting after cliff
        uint256 timeAfterCliff = block.timestamp - (schedule.startTime + schedule.cliffDuration);
        uint256 vestingDurationAfterCliff = schedule.duration - schedule.cliffDuration;
        
        return (schedule.totalAmount * timeAfterCliff) / vestingDurationAfterCliff;
    }
    
    /**
     * @dev Releases vested tokens to the beneficiary
     */
    function releaseVestedTokens() external {
        address beneficiary = _msgSender();
        uint256 amount = releasableAmount(beneficiary);
        
        require(amount > 0, "No tokens to release");
        
        vestingSchedules[beneficiary].releasedAmount += amount;
        _transfer(address(this), beneficiary, amount);
        
        emit TokensReleased(beneficiary, amount);
    }
    
    /**
     * @dev Revokes a vesting schedule (only if revocable)
     */
    function revokeVesting(address beneficiary) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(schedule.revocable, "Vesting is not revocable");
        require(!schedule.revoked, "Vesting already revoked");
        
        uint256 unreleased = schedule.totalAmount - schedule.releasedAmount;
        schedule.revoked = true;
        
        if (unreleased > 0) {
            _transfer(address(this), owner(), unreleased);
        }
        
        emit VestingRevoked(beneficiary);
    }
    
    // ==================== STAKING FUNCTIONALITY ====================
    
    /**
     * @dev Stakes tokens to earn rewards
     */
    function stake(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(_msgSender()) >= amount, "Insufficient balance");
        
        // If already staking, claim rewards first
        if (stakedBalance[_msgSender()] > 0) {
            _claimRewards();
        }
        
        _transfer(_msgSender(), address(this), amount);
        stakedBalance[_msgSender()] += amount;
        stakingStartTime[_msgSender()] = block.timestamp;
        totalStaked += amount;
        
        emit TokensStaked(_msgSender(), amount);
    }
    
    /**
     * @dev Unstakes tokens and claims rewards
     */
    function unstake() external whenNotPaused {
        uint256 amount = stakedBalance[_msgSender()];
        require(amount > 0, "No tokens staked");
        
        uint256 rewards = calculateRewards(_msgSender());
        
        stakedBalance[_msgSender()] = 0;
        stakingStartTime[_msgSender()] = 0;
        totalStaked -= amount;
        
        _transfer(address(this), _msgSender(), amount);
        
        if (rewards > 0) {
            _mint(_msgSender(), rewards);
        }
        
        emit TokensUnstaked(_msgSender(), amount, rewards);
    }
    
    /**
     * @dev Calculates pending rewards for a user
     */
    function calculateRewards(address user) public view returns (uint256) {
        uint256 staked = stakedBalance[user];
        if (staked == 0 || stakingStartTime[user] == 0) {
            return 0;
        }
        
        uint256 stakingDuration = block.timestamp - stakingStartTime[user];
        uint256 annualReward = (staked * REWARD_RATE) / 1000; // REWARD_RATE is in basis points
        
        return (annualReward * stakingDuration) / 365 days;
    }
    
    /**
     * @dev Internal function to claim rewards
     */
    function _claimRewards() internal {
        uint256 rewards = calculateRewards(_msgSender());
        if (rewards > 0) {
            stakingStartTime[_msgSender()] = block.timestamp;
            _mint(_msgSender(), rewards);
        }
    }
    
    /**
     * @dev Allows owner to pause token transfers in emergency
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Allows owner to unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Returns the maximum supply of tokens
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
    
    /**
     * @dev Returns the remaining mintable supply
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - _totalSupply;
    }
    
    /**
     * @dev Returns the number of vesting beneficiaries
     */
    function getVestingBeneficiariesCount() external view returns (uint256) {
        return vestingBeneficiaries.length;
    }
}
