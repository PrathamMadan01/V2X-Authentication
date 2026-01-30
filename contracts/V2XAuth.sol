// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title V2XAuth
 * @notice Simple V2X authentication registry.
 *         Binds a hashed vehicle identifier (e.g., VIN) to an Ethereum address.
 *         Only the contract owner (transport authority) can register/revoke vehicles.
 */
contract V2XAuth {
    struct Vehicle {
        address vehicleAddress;
        bool active;
        uint256 registeredAt;
        uint256 revokedAt;
    }

    address public owner;

    mapping(bytes32 => Vehicle) private vehicles;

    event VehicleRegistered(bytes32 indexed vehicleIdHash, address indexed vehicleAddress);
    event VehicleRevoked(bytes32 indexed vehicleIdHash, address indexed vehicleAddress);
    event AccidentReported(bytes32 indexed vehicleIdHash, uint256 timestamp, string location, uint256 speed, string details);
    event Deposit(address indexed vehicle, uint256 amount);
    event TollPaid(address indexed vehicle, address indexed operator, uint256 amount);

    error NotOwner();
    error VehicleAlreadyRegistered();
    error VehicleNotRegistered();
    error VehicleAlreadyRevoked();
    error InsufficientBalance();
    error NotAuthorized();

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // --- Fastag / Payment Logic ---
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function payToll(address operator, uint256 amount) external {
        if (balances[msg.sender] < amount) {
            revert InsufficientBalance();
        }
        balances[msg.sender] -= amount;
        balances[operator] += amount;
        emit TollPaid(msg.sender, operator, amount);
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        if (amount == 0) revert InsufficientBalance();
        balances[msg.sender] = 0;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    // --- Accident Reporting ---
    function reportAccident(bytes32 vehicleIdHash, string calldata location, uint256 speed, string calldata details) external {
        Vehicle storage v = vehicles[vehicleIdHash];
        if (v.vehicleAddress != msg.sender) {
            revert NotAuthorized();
        }
        if (!v.active) {
            revert VehicleNotRegistered();
        }
        
        emit AccidentReported(vehicleIdHash, block.timestamp, location, speed, details);
    }

    /**
     * @notice Register a vehicle.
     * @param vehicleIdHash keccak256 hash of some stable vehicle identifier (e.g., VIN)
     * @param vehicleAddress Ethereum address controlled by the vehicle
     */
    function registerVehicle(bytes32 vehicleIdHash, address vehicleAddress) external onlyOwner {
        Vehicle storage v = vehicles[vehicleIdHash];
        if (v.vehicleAddress != address(0) && v.active) {
            revert VehicleAlreadyRegistered();
        }

        vehicles[vehicleIdHash] = Vehicle({
            vehicleAddress: vehicleAddress,
            active: true,
            registeredAt: block.timestamp,
            revokedAt: 0
        });

        emit VehicleRegistered(vehicleIdHash, vehicleAddress);
    }

    /**
     * @notice Revoke a vehicle (e.g., compromised key, decommissioned).
     */
    function revokeVehicle(bytes32 vehicleIdHash) external onlyOwner {
        Vehicle storage v = vehicles[vehicleIdHash];
        if (v.vehicleAddress == address(0)) {
            revert VehicleNotRegistered();
        }
        if (!v.active) {
            revert VehicleAlreadyRevoked();
        }

        v.active = false;
        v.revokedAt = block.timestamp;

        emit VehicleRevoked(vehicleIdHash, v.vehicleAddress);
    }

    /**
     * @notice Returns the registered vehicle address and status.
     */
    function getVehicle(bytes32 vehicleIdHash) external view returns (Vehicle memory) {
        return vehicles[vehicleIdHash];
    }

    /**
     * @notice Returns true if the vehicle is registered and active.
     */
    function isVehicleActive(bytes32 vehicleIdHash) external view returns (bool) {
        Vehicle storage v = vehicles[vehicleIdHash];
        return v.vehicleAddress != address(0) && v.active;
    }
}

