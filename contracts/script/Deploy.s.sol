// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/IdentityRegistry.sol";
import "../src/ReputationRegistry.sol";
import "../src/ValidationRegistry.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deploying from:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerKey);

        // Deploy IdentityRegistry first (others depend on it)
        IdentityRegistry identity = new IdentityRegistry();
        console.log("IdentityRegistry:", address(identity));

        // Deploy ReputationRegistry with identity address
        ReputationRegistry reputation = new ReputationRegistry(address(identity));
        console.log("ReputationRegistry:", address(reputation));

        // Deploy ValidationRegistry with identity address
        ValidationRegistry validation = new ValidationRegistry(address(identity));
        console.log("ValidationRegistry:", address(validation));

        vm.stopBroadcast();

        // Log env vars for copy-paste
        console.log("\n--- .env.local values ---");
        console.log("NEXT_PUBLIC_IDENTITY_REGISTRY=", vm.toString(address(identity)));
        console.log("NEXT_PUBLIC_REPUTATION_REGISTRY=", vm.toString(address(reputation)));
        console.log("NEXT_PUBLIC_VALIDATION_REGISTRY=", vm.toString(address(validation)));
    }
}
