# Deployment Guide for V2X Authentication System

This guide explains how to deploy the V2X Authentication System for commercial use using Docker and Docker Compose.

## Prerequisites

- **Docker** and **Docker Compose** installed on your server.
- **Ethereum Node (RPC URL)**: You need access to an Ethereum network (Mainnet, Sepolia, Polygon, etc.).
- **Private Key**: A wallet private key for the backend to interact with the blockchain.
- **Contract Address**: The deployed address of the `V2XAuth` smart contract.

## Project Structure

- `backend/`: Node.js/Express application.
- `frontend/`: React application (served via Nginx).
- `docker-compose.yml`: Orchestration file.

## Steps to Deploy

1.  **Clone/Upload the Repository** to your server.

2.  **Configure Environment Variables**:
    Create a `.env` file in the root directory based on `.env.example`:

    ```bash
    cp .env.example .env
    ```

    Edit `.env` and fill in your details:

    ```ini
    ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
    PRIVATE_KEY=0x...
    CONTRACT_ADDRESS=0x...
    ```

3.  **Build and Run**:
    Run the following command to build the Docker images and start the services:

    ```bash
    docker-compose up -d --build
    ```

    - The **Frontend** will be accessible at `http://your-server-ip` (Port 80).
    - The **Backend** will be running internally and accessible to the frontend via the Nginx proxy at `/api`.

4.  **Verify Deployment**:
    - Open your browser and navigate to your server's IP address or domain.
    - You should see the Landing Page.
    - Try to login/register to verify backend connectivity.

## Commercial/Production Considerations

- **SSL/HTTPS**: For a commercial release, you MUST use HTTPS.
  - Recommended: Set up a reverse proxy like **Traefik** or use **Certbot** with Nginx on the host machine to handle SSL termination.
- **Database**: Currently, the system relies on the Blockchain for state. If you add a local database (e.g., MongoDB/PostgreSQL) for caching, ensure it is persisted using Docker volumes.
- **Security**:
  - Never commit your `.env` file to version control.
  - Use a secrets manager for the Private Key in a real production environment.
