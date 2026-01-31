## V2X Authentication Application (Blockchain-Based)

This is a reference V2X (Vehicle-to-Everything) authentication system built on a public EVM-compatible blockchain.

### Components

- **Solidity smart contract**: `contracts/V2XAuth.sol` stores registered vehicles and their blockchain identities, supports registration and revocation, and exposes read-only queries.
- **Node.js/TypeScript backend**: `backend/` exposes REST APIs for:
  - **Vehicle registration** (by an authority wallet)
  - **Vehicle authentication** via signed nonces
  - **Revocation** of compromised or decommissioned vehicles
- **React Frontend**: `frontend/` provides a user-friendly interface:
  - **Landing Page**: Overview and entry point.
  - **User Dashboard**: For vehicle owners to view status, GPS data, and Fastag balance.
  - **Admin Dashboard**: For authorities to monitor active vehicles and accidents in real-time.

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
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Leaflet

### Quick Start (Local Development)

#### Backend
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Set environment variables (see `.env.example`).
3. Run the backend:
   ```bash
   npm run dev
   ```

#### Frontend
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Run the frontend:
   ```bash
   npm run dev
   ```

### Deployment (Docker)

This project is ready for commercial deployment using Docker.

1. Configure `.env` file in the root directory.
2. Run with Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.
