// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IdentityRegistry.sol";

/// @title ValidationRegistry — Work validation request/response with 0-100 scoring
contract ValidationRegistry {
    IdentityRegistry public immutable identityRegistry;

    enum ValidationStatus { Pending, Approved, Rejected, Disputed }

    struct ValidationRequest {
        bytes32 jobId;
        uint256 agentId;
        address poster;
        string workURI;         // IPFS URI pointing to completed work
        uint8 selfScore;        // Agent's self-assessment 0-100
        uint256 requestedAt;
        ValidationStatus status;
    }

    struct ValidationResponse {
        uint256 requestId;
        uint8 score;            // Poster's score 0-100
        string feedback;
        bool approved;
        uint256 respondedAt;
    }

    uint256 private _requestCounter;

    // requestId => ValidationRequest
    mapping(uint256 => ValidationRequest) public requests;
    // requestId => ValidationResponse
    mapping(uint256 => ValidationResponse) public responses;
    // jobId => requestId
    mapping(bytes32 => uint256) public jobToRequest;
    // agentId => requestId[]
    mapping(uint256 => uint256[]) public agentRequests;

    event ValidationRequested(uint256 indexed requestId, bytes32 jobId, uint256 agentId);
    event ValidationResponded(uint256 indexed requestId, uint8 score, bool approved);
    event ValidationDisputed(uint256 indexed requestId);

    error NotPoster();
    error NotAgent();
    error AlreadyResponded();
    error InvalidStatus();
    error InvalidScore();

    constructor(address _identityRegistry) {
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    /// @notice Agent submits work for validation
    function requestValidation(
        bytes32 jobId,
        address poster,
        string calldata workURI,
        uint8 selfScore
    ) external returns (uint256 requestId) {
        if (selfScore > 100) revert InvalidScore();

        uint256 agentId = identityRegistry.getAgentId(msg.sender);
        require(agentId != 0, "Not registered as agent");

        _requestCounter++;
        requestId = _requestCounter;

        requests[requestId] = ValidationRequest({
            jobId: jobId,
            agentId: agentId,
            poster: poster,
            workURI: workURI,
            selfScore: selfScore,
            requestedAt: block.timestamp,
            status: ValidationStatus.Pending
        });

        jobToRequest[jobId] = requestId;
        agentRequests[agentId].push(requestId);

        emit ValidationRequested(requestId, jobId, agentId);
    }

    /// @notice Poster responds to a validation request
    function respond(
        uint256 requestId,
        uint8 score,
        string calldata feedback,
        bool approved
    ) external {
        ValidationRequest storage req = requests[requestId];
        if (req.poster != msg.sender) revert NotPoster();
        if (req.status != ValidationStatus.Pending) revert AlreadyResponded();
        if (score > 100) revert InvalidScore();

        req.status = approved ? ValidationStatus.Approved : ValidationStatus.Rejected;

        responses[requestId] = ValidationResponse({
            requestId: requestId,
            score: score,
            feedback: feedback,
            approved: approved,
            respondedAt: block.timestamp
        });

        emit ValidationResponded(requestId, score, approved);
    }

    /// @notice Dispute a validation response
    function dispute(uint256 requestId) external {
        ValidationRequest storage req = requests[requestId];
        uint256 agentId = identityRegistry.getAgentId(msg.sender);
        if (req.agentId != agentId) revert NotAgent();
        if (req.status == ValidationStatus.Pending) revert InvalidStatus();

        req.status = ValidationStatus.Disputed;
        emit ValidationDisputed(requestId);
    }

    function getRequest(uint256 requestId) external view returns (ValidationRequest memory) {
        return requests[requestId];
    }

    function getResponse(uint256 requestId) external view returns (ValidationResponse memory) {
        return responses[requestId];
    }

    function getAgentRequests(uint256 agentId) external view returns (uint256[] memory) {
        return agentRequests[agentId];
    }
}
