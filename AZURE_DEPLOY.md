# Azure CI/CD Pipeline Setup for V2X Authentication

This guide explains how to set up the Azure DevOps Pipeline for the V2X Authentication System.

## Prerequisites

1.  **Azure DevOps Account**: You need an active organization and project.
2.  **Azure Subscription**: Required if you plan to deploy to Azure resources (like App Service or Kubernetes).
3.  **GitHub Repository**: Ensure your code is pushed to GitHub.

## Pipeline Overview

The `azure-pipelines.yml` file defines a multi-stage pipeline:
1.  **Build Stage**:
    - Installs Node.js.
    - Installs dependencies and builds the Backend.
    - Installs dependencies and builds the Frontend.
2.  **DockerBuild Stage** (Optional/Commented):
    - Builds Docker images for Frontend and Backend.
    - Pushes images to Azure Container Registry (ACR).

## Steps to Configure

### 1. Push Code to Repository
Ensure your `azure-pipelines.yml` is committed and pushed to your repository.

### 2. Create a New Pipeline in Azure DevOps
1.  Go to **Pipelines** > **New Pipeline**.
2.  Select **GitHub** as the source.
3.  Select your repository.
4.  Choose **"Existing Azure Pipelines YAML file"**.
5.  Select `azure-pipelines.yml` from the dropdown.
6.  Click **Run** to test the build.

### 3. (Optional) Configure Docker Push to ACR
To enable Docker image pushing:
1.  Create an **Azure Container Registry (ACR)** in the Azure Portal.
2.  In Azure DevOps, go to **Project Settings** > **Service connections** > **New service connection** > **Docker Registry** > **Azure Container Registry**.
3.  Name the connection (e.g., `youracr`).
4.  Uncomment the `DockerBuild` stage in `azure-pipelines.yml` and update the `registryName` variable or input.

## Continuous Deployment (CD)
To deploy the containers to Azure App Service or Kubernetes (AKS):
1.  Add a **Deploy** stage to the pipeline.
2.  Use the `AzureWebAppContainer@1` task for App Service or `KubernetesManifest@0` for AKS.
