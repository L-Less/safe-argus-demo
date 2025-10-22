// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Authorizer {
    address public admin;
    mapping(bytes32 => bool) private _permissions;

    event PermissionSet(address indexed executor, address indexed target, bytes4 indexed selector, bool allowed);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function setPermission(address executor, address target, bytes4 selector, bool allowed) external onlyAdmin {
        bytes32 key = keccak256(abi.encodePacked(executor, target, selector));
        _permissions[key] = allowed;
        emit PermissionSet(executor, target, selector, allowed);
    }

    function canExecute(address executor, address target, bytes4 selector) external view returns (bool) {
        return _permissions[keccak256(abi.encodePacked(executor, target, selector))];
    }
}
