## V2X Authentication Application (Blockchain-Based)

This is a reference V2X (Vehicle-to-Everything) authentication system built on a public EVM-compatible blockchain.

### Components

- **Solidity smart contract**: `contracts/V2XAuth.sol` stores registered vehicles and their blockchain identities, supports registration and revocation, and exposes read-only queries.
- **Node.js/TypeScript backend**: `backend/` exposes REST APIs for:
  - **Vehicle registration** (by an authority wallet)
  - **Vehicle authentication** via signed nonces
  - **Revocation** of compromised or decommissioned vehicles

### High-Level Flow

1. **Registration**: A transport authority calls the backend API, which sends a transaction to `V2XAuth` to bind a hashed vehicle identifier to a vehicle wallet address.
2. **Authentication**: Vehicles prove identity by signing a server-provided nonce with their private key. The backend:
   - Hashes the vehicle identifier
   - Reads the expected address from the `V2XAuth` contract
   - Recovers the address from the signature
   - Verifies they match and returns an authentication result
3. **Revocation**: The authority can revoke vehicles on-chain. Future authentications for revoked vehicles fail.

### Stack

- **Blockchain**: Any EVM-compatible network (e.g., Ethereum testnet, Polygon, local Hardhat node)
- **Contract language**: Solidity
- **Backend**: Node.js, TypeScript, Express, `ethers`

### Quick Start (Backend)

1. Install dependencies:

```bash
cd backend
npm install
```

2. Set environment variables (e.g. in `.env`):

```bash
ETH_RPC_URL=<your_rpc_url>
PRIVATE_KEY=<authority_wallet_private_key>
CONTRACT_ADDRESS=<deployed_V2XAuth_contract_address>
PORT=4000
```

3. Run the backend:

```bash
npm run dev
```

4. Example API calls:

- **Register vehicle**:

```bash
curl -X POST http://localhost:4000/api/vehicles/register \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "VIN123456789",
    "vehicleAddress": "0x1234...abcd"
  }'
```

- **Authenticate vehicle** (two-step: get nonce, then verify):

```bash
curl -X POST http://localhost:4000/api/vehicles/nonce \
  -H "Content-Type: application/json" \
  -d '{ "vehicleId": "VIN123456789" }'
```

Use the returned `nonce` to sign with the vehicle wallet, then:

```bash
curl -X POST http://localhost:4000/api/vehicles/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "VIN123456789",
    "nonce": "<nonce_from_server>",
    "signature": "<signature_from_vehicle_wallet>"
  }'
```

### Next Steps

- Integrate RSUs and roadside infrastructure using the same authentication APIs.
- Add TLS and mTLS between RSUs and backend.
- Add role-based access control and logging for production use.

