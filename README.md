# ☁️ FinOps & Compliance Automation Pipeline

A fully serverless, event-driven architecture designed to autonomously monitor AWS infrastructure costs, detect idle resources, and enforce security baselines. This repository contains both the Next.js executive dashboard and the AWS Lambda backend configuration.

## 📋 Executive Summary
Cloud environments scale rapidly, often leading to unchecked costs and security configuration drift. This project replaces manual infrastructure auditing with an automated pipeline that operates entirely on the AWS Free Tier (excluding nominal API usage). It provides real-time, immutable financial and security telemetry through automated email alerts and an executive-facing web dashboard.

## 🏗️ System Architecture

### 1. Serverless Audit Engine (Backend)
* **Trigger:** Amazon EventBridge executes a Cron schedule daily at 08:00 UTC.
* **Compute:** An AWS Lambda function (Python 3.12) queries the AWS Cost Explorer API for 24-hour trailing spend and evaluates AWS Config for security compliance.
* **Storage:** Telemetry is compiled into a structured `.txt` report and uploaded to an Amazon S3 bucket enforcing Server-Side Encryption (SSE-S3) and blocking all public access.
* **Alerting:** S3 triggers an Amazon SNS topic, dispatching real-time email notifications to administrators via Amazon SES.

### 2. Executive Command Center (Frontend)
* **Framework:** Built with Next.js 16 (App Router), React, and Tailwind CSS.
* **Secure Connection:** Utilizes Next.js Server Components and the `@aws-sdk/client-s3` to securely fetch the latest S3 reports. Authentication is handled via a dedicated, read-only IAM user to ensure zero credential exposure on the client side.
* **Dynamic Rendering:** Implements React `<Suspense>` boundaries to force dynamic, per-request rendering, bypassing static build conflicts while providing a seamless loading state.

## 🔒 Security & Compliance Posture
* **Principle of Least Privilege:** The Lambda execution role and Next.js IAM user are restricted via granular, inline policies strictly limited to required `ce:GetCostAndUsage`, `config`, and `s3` actions.
* **Immutable Audit Logging:** By decoupling visualization from data generation, the S3 bucket acts as an immutable, tamper-proof ledger of all historical audits.
* **Client-Side Export:** A dedicated React Client Component generates downloadable Blob files from server-rendered S3 data, allowing executives to export raw audit logs directly from browser memory.

## 💻 Tech Stack
* **Cloud Backend:** AWS Lambda, Amazon EventBridge, Amazon S3, Amazon SNS, Amazon SES, AWS Cost Explorer, AWS Config, Python (Boto3).
* **Frontend:** Next.js (TypeScript), React, Tailwind CSS, Lucide Icons, AWS SDK for JavaScript.

## 📂 Repository Structure

```text
finops-frontend/
├── app/
│   ├── page.tsx               # Main Server Component & Dashboard UI
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Tailwind configuration
├── components/
│   └── DownloadButton.tsx     # Client Component for secure log exports
├── aws-backend/
│   ├── lambda_function.py     # Python audit engine source code
│   └── iam-policies/          # JSON security policies for least-privilege roles
├── public/                    # Static assets
└── package.json               # Node dependencies

🚀 Local Development Setup
Clone the repository:
Bash
git clone [https://github.com/YOUR_USERNAME/finops-frontend.git](https://github.com/YOUR_USERNAME/finops-frontend.git)
cd finops-frontend
Install dependencies:
Bash
npm install
Configure Environment Variables:
Create a .env.local file in the root directory and add your read-only IAM credentials:
Code snippet
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=your-s3-bucket-name
Run the development server:
Bash
npm run dev
Open http://localhost:3000 with your browser to see the live dashboard.