// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title IdentityRegistry — ERC-8004 inspired on-chain agent identity
/// @dev ERC-721 where each token represents a unique agent identity
contract IdentityRegistry is ERC721, Ownable {
    uint256 private _nextTokenId;

    struct AgentIdentity {
        string agentURI;    // IPFS/HTTPS URI to agent metadata JSON
        address wallet;     // primary wallet address
        uint256 registeredAt;
        bool active;
    }

    // tokenId => AgentIdentity
    mapping(uint256 => AgentIdentity) public identities;
    // wallet => tokenId (0 = not registered)
    mapping(address => uint256) public walletToAgent;
    // tokenId => additional authorized wallets
    mapping(uint256 => mapping(address => bool)) public authorizedWallets;

    event AgentRegistered(uint256 indexed tokenId, address indexed wallet, string agentURI);
    event AgentURIUpdated(uint256 indexed tokenId, string newURI);
    event WalletAuthorized(uint256 indexed tokenId, address wallet);
    event AgentDeactivated(uint256 indexed tokenId);

    error AlreadyRegistered();
    error NotAgentOwner();
    error InvalidURI();

    constructor() ERC721("AgentIdentity", "AID") Ownable(msg.sender) {}

    /// @notice Register as an agent. One registration per wallet.
    function register(string calldata agentURI) external returns (uint256 tokenId) {
        if (walletToAgent[msg.sender] != 0) revert AlreadyRegistered();
        if (bytes(agentURI).length == 0) revert InvalidURI();

        _nextTokenId++;
        tokenId = _nextTokenId;

        _safeMint(msg.sender, tokenId);

        identities[tokenId] = AgentIdentity({
            agentURI: agentURI,
            wallet: msg.sender,
            registeredAt: block.timestamp,
            active: true
        });

        walletToAgent[msg.sender] = tokenId;

        emit AgentRegistered(tokenId, msg.sender, agentURI);
    }

    /// @notice Update agent metadata URI
    function updateAgentURI(uint256 tokenId, string calldata newURI) external {
        if (ownerOf(tokenId) != msg.sender) revert NotAgentOwner();
        if (bytes(newURI).length == 0) revert InvalidURI();

        identities[tokenId].agentURI = newURI;
        emit AgentURIUpdated(tokenId, newURI);
    }

    /// @notice Authorize an additional wallet for this agent
    function authorizeWallet(uint256 tokenId, address wallet) external {
        if (ownerOf(tokenId) != msg.sender) revert NotAgentOwner();
        authorizedWallets[tokenId][wallet] = true;
        emit WalletAuthorized(tokenId, wallet);
    }

    /// @notice Deactivate an agent identity
    function deactivate(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender && owner() != msg.sender) revert NotAgentOwner();
        identities[tokenId].active = false;
        emit AgentDeactivated(tokenId);
    }

    /// @notice Get agent identity by token ID
    function getIdentity(uint256 tokenId) external view returns (AgentIdentity memory) {
        return identities[tokenId];
    }

    /// @notice Get agent token ID for a wallet (0 if not registered)
    function getAgentId(address wallet) external view returns (uint256) {
        return walletToAgent[wallet];
    }

    /// @notice Check if a wallet is authorized for an agent
    function isAuthorized(uint256 tokenId, address wallet) external view returns (bool) {
        return ownerOf(tokenId) == wallet || authorizedWallets[tokenId][wallet];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return identities[tokenId].agentURI;
    }

    function totalAgents() external view returns (uint256) {
        return _nextTokenId;
    }
}
