// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DocumentNotary {

    struct Record {
        bytes32 documentHash;
        uint256 timestamp;
        address wallet;
    }

    mapping(bytes32 => mapping(string => Record)) private records;

    event Notarized(
        bytes32 indexed module,
        string id,
        bytes32 documentHash,
        uint256 timestamp,
        address wallet
    );

    function notarize(
        string calldata module,
        string calldata id,
        bytes32 documentHash
    ) external {
        bytes32 moduleKey = keccak256(abi.encodePacked(module));
        records[moduleKey][id] = Record(documentHash, block.timestamp, msg.sender);
        emit Notarized(moduleKey, id, documentHash, block.timestamp, msg.sender);
    }

    function getRecord(
        string calldata module,
        string calldata id
    ) external view returns (bytes32, uint256, address) {
        bytes32 moduleKey = keccak256(abi.encodePacked(module));
        Record storage r = records[moduleKey][id];
        return (r.documentHash, r.timestamp, r.wallet);
    }

    function verify(
        string calldata module,
        string calldata id,
        bytes32 documentHash
    ) external view returns (bool) {
        bytes32 moduleKey = keccak256(abi.encodePacked(module));
        Record storage r = records[moduleKey][id];
        return r.documentHash == documentHash && r.timestamp > 0;
    }
}
