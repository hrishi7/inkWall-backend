# Deployment Guide

This guide explains how to deploy the **WallCraft Backend** using **MongoDB Atlas** (Database) and **Render** (Server) for free.

## Prerequisites
- GitHub Account
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas/register) (Free Tier)
- [Render Account](https://dashboard.render.com/register) (Free Tier)

---

## Part 1: Set up MongoDB Atlas (Database)

1.  **Create a Cluster**:
    - Log in to MongoDB Atlas.
    - Click **+ Create** or **Build a Database**.
    - Select **M0 Free** (Shared).
    - Provider: **AWS**, Region: **Choose closest to you**.
    - Click **Create Deployment**.

2.  **Create Database User**:
    - Usage: **Username/Password**.
    - Username: `wallcraft_user` (or your choice).
    - Password: **Auto-generate** (Copy and save this!).
    - Click **Create Database User**.

3.  **Network Access**:
    - Click **Choose a connection method**.
    - Select **Allow Access from Anywhere** (0.0.0.0/0). *Note: For production, you can restrict this later, but Render IPs vary.*
    - Click **Add IP Address**.

4.  **Get Connection String**:
    - Go to **Database** > **Connect** -> **Drivers**.
    - Select **Node.js**.
    - Copy the connection string. It checks like:
      `mongodb+srv://wallcraft_user:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    - Replace `<password>` with the password you saved in Step 2.
    - **Save this full string** for Part 2.

---

## Part 2: Deploy to Render (App Server)

1.  **Create Web Service**:
    - Log in to Render Dashboard.
    - Click **New +** -> **Web Service**.
    - Connect your GitHub repository properly.

2.  **Configure Settings**:
    - **Name**: `wallcraft-backend`
    - **Region**: Same as your MongoDB if possible.
    - **Branch**: `main`
    - **Root Directory**: `backend` (Important! Since your repo has subfolders)
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
    - **Instance Type**: **Free**

3.  **Environment Variables**:
    - Scroll down to **Environment Variables** and add:
        - `Key`: `MONGODB_URI`
        - `Value`: (Paste your connection string from Part 1)
        - `Key`: `UNSPLASH_ACCESS_KEY`
        - `Value`: (Your Unsplash Access Key)
        - `Key`: `PEXELS_API_KEY`
        - `Value`: (Your Pexels API Key - Optional)

4.  **Deploy**:
    - Click **Create Web Service**.
    - Wait for the build to finish.
    - You should see logs indicating:
      `📦 Connected to MongoDB`
      `✅ Database service initialized`
      `⚠️ No categories found, seeding defaults...`

---

## Part 3: Verification

1.  Open your Render URL (e.g., `https://wallcraft-backend.onrender.com/api/health`).
    - Should return `{"status":"ok"}`.
2.  Check the API: `https://wallcraft-backend.onrender.com/api/wallpapers`
    - It should return a list of wallpapers (the app automatically fetches them on first start).

## Troubleshooting

- **"Connection failed"**: Check if your MongoDB user password contains special characters. If so, URL-encode them. Ensure Network Access is set to `0.0.0.0/0`.
- **"Unsplash Rate Limit"**: The free Unsplash API allows 50 requests/hour. The app caches results in MongoDB to respect this.
