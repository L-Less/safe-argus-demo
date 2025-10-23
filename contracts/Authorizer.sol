// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Authorizer 合约
/// @notice 这是一个简单的访问控制（ACL）合约，
///         用于定义哪些地址可以调用哪些目标合约的哪些函数。
contract Authorizer {
    /// @notice 管理员地址（只有管理员能修改权限）
    address public admin;

    /// @dev 用 keccak256(executor, target, selector) 作为 key 存储权限布尔值
    mapping(bytes32 => bool) private _permissions;

    /// @notice 当权限被设置或修改时触发
    event PermissionSet(
        address indexed executor, // 授权的执行者
        address indexed target,   // 允许调用的目标合约
        bytes4 indexed selector,  // 允许调用的函数选择器
        bool allowed              // 是否允许执行
    );

    /// @notice 限制只有管理员能执行的修饰符
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin"); // 检查调用者是否为管理员
        _;
    }

    /// @notice 构造函数，部署者自动成为管理员
    constructor() {
        admin = msg.sender;
    }

    /// @notice 管理员设置某个执行者(executor)对某个目标(target)的某个函数(selector)是否有调用权限
    /// @param executor 执行交易的地址（比如某个Bot或合约）
    /// @param target 被调用的目标合约地址
    /// @param selector 目标函数的选择器（bytes4）
    /// @param allowed 是否允许执行（true 表示允许）
    function setPermission(
        address executor,
        address target,
        bytes4 selector,
        bool allowed
    ) external onlyAdmin {
        // 计算权限的唯一key
        bytes32 key = keccak256(abi.encodePacked(executor, target, selector));
        // 设置权限
        _permissions[key] = allowed;
        // 发出事件日志
        emit PermissionSet(executor, target, selector, allowed);
    }

    /// @notice 查询某个执行者是否有权限调用指定函数
    /// @param executor 执行交易的地址
    /// @param target 被调用的合约地址
    /// @param selector 函数选择器
    /// @return bool 是否允许
    function canExecute(
        address executor,
        address target,
        bytes4 selector
    ) external view returns (bool) {
        // 根据 key 检查权限
        return _permissions[keccak256(abi.encodePacked(executor, target, selector))];
    }
}
