// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IdentityRegistry.sol";

/// @title ReputationRegistry — ERC-8004 feedback + reputation storage
contract ReputationRegistry {
    IdentityRegistry public immutable identityRegistry;

    struct Feedback {
        uint256 agentId;
        address poster;
        uint8 score;        // 0-100
        string comment;
        bytes32 jobId;      // off-chain Supabase job UUID as bytes32
        bytes32 paymentProof; // Unlink ZK proof hash or tx hash
        uint256 timestamp;
    }

    struct ReputationSummary {
        uint256 totalFeedback;
        uint256 totalScore;
        uint256 avgScore;   // 0-100, scaled
        uint256 lastUpdated;
    }

    // agentId => feedback list
    mapping(uint256 => Feedback[]) private _feedbacks;
    // agentId => summary
    mapping(uint256 => ReputationSummary) public summaries;
    // poster => agentId => jobId => already rated
    mapping(address => mapping(uint256 => mapping(bytes32 => bool))) public hasRated;

    event FeedbackGiven(
        uint256 indexed agentId,
        address indexed poster,
        uint8 score,
        bytes32 jobId
    );

    error NotJobPoster();
    error AlreadyRated();
    error InvalidScore();
    error AgentNotRegistered();

    constructor(address _identityRegistry) {
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    /// @notice Give feedback to an agent for completed work
    function giveFeedback(
        uint256 agentId,
        uint8 score,
        string calldata comment,
        bytes32 jobId,
        bytes32 paymentProof
    ) external {
        if (score > 100) revert InvalidScore();
        if (identityRegistry.getIdentity(agentId).wallet == address(0)) revert AgentNotRegistered();
        if (hasRated[msg.sender][agentId][jobId]) revert AlreadyRated();

        hasRated[msg.sender][agentId][jobId] = true;

        _feedbacks[agentId].push(Feedback({
            agentId: agentId,
            poster: msg.sender,
            score: score,
            comment: comment,
            jobId: jobId,
            paymentProof: paymentProof,
            timestamp: block.timestamp
        }));

        ReputationSummary storage summary = summaries[agentId];
        summary.totalFeedback += 1;
        summary.totalScore += score;
        summary.avgScore = summary.totalScore / summary.totalFeedback;
        summary.lastUpdated = block.timestamp;

        emit FeedbackGiven(agentId, msg.sender, score, jobId);
    }

    /// @notice Get reputation summary for an agent
    function getSummary(uint256 agentId) external view returns (ReputationSummary memory) {
        return summaries[agentId];
    }

    /// @notice Get all feedbacks for an agent (paginated)
    function getFeedbacks(uint256 agentId, uint256 offset, uint256 limit)
        external
        view
        returns (Feedback[] memory result)
    {
        Feedback[] storage all = _feedbacks[agentId];
        uint256 end = offset + limit > all.length ? all.length : offset + limit;
        result = new Feedback[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = all[i];
        }
    }

    /// @notice Get total feedback count for an agent
    function getFeedbackCount(uint256 agentId) external view returns (uint256) {
        return _feedbacks[agentId].length;
    }
}
