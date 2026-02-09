// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FinBridge Governance
 * @dev Decentralized governance for platform decisions
 */
contract FinBridgeGovernance is ReentrancyGuard, Ownable {
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        uint256 createdAt;
    }
    
    struct Vote {
        address voter;
        uint256 proposalId;
        bool support;
        uint256 votedAt;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) public hasVoted;
    mapping(address => uint256) public votingPower;
    
    uint256 public nextProposalId = 1;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant MIN_VOTING_POWER = 1 ether;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event VoteCast(address indexed voter, uint256 indexed proposalId, bool support);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    
    function createProposal(string memory description) external {
        require(votingPower[msg.sender] >= MIN_VOTING_POWER, "Insufficient voting power");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        uint256 proposalId = nextProposalId++;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            deadline: block.timestamp + VOTING_PERIOD,
            executed: false,
            createdAt: block.timestamp
        });
        
        emit ProposalCreated(proposalId, msg.sender, description);
    }
    
    function vote(uint256 proposalId, bool support) external {
        require(!proposals[proposalId].executed, "Proposal already executed");
        require(block.timestamp < proposals[proposalId].deadline, "Voting period ended");
        require(!hasVoted[msg.sender][proposalId], "Already voted");
        require(votingPower[msg.sender] >= MIN_VOTING_POWER, "Insufficient voting power");
        
        hasVoted[msg.sender][proposalId] = true;
        
        if (support) {
            proposals[proposalId].votesFor++;
        } else {
            proposals[proposalId].votesAgainst++;
        }
        
        emit VoteCast(msg.sender, proposalId, support);
    }
    
    function executeProposal(uint256 proposalId) external {
        require(block.timestamp >= proposals[proposalId].deadline, "Voting period not ended");
        require(!proposals[proposalId].executed, "Proposal already executed");
        require(proposals[proposalId].votesFor > proposals[proposalId].votesAgainst, "Proposal did not pass");
        
        proposals[proposalId].executed = true;
        
        emit ProposalExecuted(proposalId, true);
    }
    
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
    
    function getUserVotes(address user) external view returns (uint256[] memory) {
        uint256[] memory userProposalIds = new uint256[](100);
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextProposalId && count < 100; i++) {
            if (hasVoted[user][i]) {
                userProposalIds[count] = i;
                count++;
            }
        }
        
        return userProposalIds;
    }
}
