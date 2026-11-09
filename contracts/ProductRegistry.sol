// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Public demo registry. Registration is an issuer assertion, not physical authentication.
contract ProductRegistry {
    address public immutable administrator;
    mapping(address => bool) public manufacturers;
    struct Product {
        string productId;
        string name;
        string brand;
        string category;
        string batch;
        string manufacturerName;
        address manufacturer;
        uint256 registeredAt;
        bytes32 metadataHash;
        bool revoked;
    }
    mapping(string => Product) private products;
    string[] private ids;
    uint256 public revokedCount;
    error Unauthorized();
    error InvalidInput();
    error DuplicateProduct();
    error ProductNotFound();
    error AlreadyRevoked();
    event ManufacturerAuthorization(address indexed manufacturer, bool authorized);
    event ProductRegistered(bytes32 indexed idHash, string productId, address indexed manufacturer, bytes32 metadataHash);
    event ProductRevoked(bytes32 indexed idHash, string productId, address indexed actor);

    constructor() { administrator = msg.sender; }
    function setManufacturer(address account, bool authorized) external {
        if (msg.sender != administrator) revert Unauthorized();
        if (account == address(0)) revert InvalidInput();
        manufacturers[account] = authorized;
        emit ManufacturerAuthorization(account, authorized);
    }
    /// @dev Canonical identifiers: 1-64 ASCII uppercase letters, digits, hyphens or underscores.
    function validId(string memory id) public pure returns (bool) {
        bytes memory b = bytes(id);
        if (b.length == 0 || b.length > 64) return false;
        for (uint256 i; i < b.length; ++i) {
            bytes1 c = b[i];
            if (!((c >= 0x41 && c <= 0x5a) || (c >= 0x30 && c <= 0x39) || c == 0x2d || c == 0x5f)) return false;
        }
        return true;
    }
    function validText(string memory value) private pure returns (bool) {
        bytes memory b = bytes(value);
        if (b.length == 0 || b.length > 160) return false;
        for (uint256 i; i < b.length; ++i) if (uint8(b[i]) > 32) return true;
        return false;
    }
    function registerProduct(string calldata id, string calldata name, string calldata brand,
        string calldata category, string calldata batch, string calldata manufacturerName, bytes32 metadataHash) external {
        if (!manufacturers[msg.sender]) revert Unauthorized();
        if (!validId(id) || !validText(name) || !validText(brand) || !validText(category)
            || !validText(batch) || !validText(manufacturerName) || metadataHash == bytes32(0)) revert InvalidInput();
        if (exists(id)) revert DuplicateProduct();
        products[id] = Product(id, name, brand, category, batch, manufacturerName, msg.sender, block.timestamp, metadataHash, false);
        ids.push(id);
        emit ProductRegistered(keccak256(bytes(id)), id, msg.sender, metadataHash);
    }
    /// @notice A removed manufacturer cannot revoke; the administrator always can.
    function revokeProduct(string calldata id) external {
        if (!exists(id)) revert ProductNotFound();
        Product storage p = products[id];
        if (msg.sender != administrator && !(manufacturers[msg.sender] && msg.sender == p.manufacturer)) revert Unauthorized();
        if (p.revoked) revert AlreadyRevoked();
        p.revoked = true;
        ++revokedCount;
        emit ProductRevoked(keccak256(bytes(id)), id, msg.sender);
    }
    function exists(string memory id) public view returns (bool) { return products[id].manufacturer != address(0); }
    function isActive(string calldata id) external view returns (bool) { return exists(id) && !products[id].revoked; }
    function getProduct(string calldata id) external view returns (Product memory) {
        if (!exists(id)) revert ProductNotFound();
        return products[id];
    }
    function totalProducts() external view returns (uint256) { return ids.length; }
    function productIdAt(uint256 index) external view returns (string memory) { return ids[index]; }
}
