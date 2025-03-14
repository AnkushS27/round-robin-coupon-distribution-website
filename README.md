# Coupon Distribution Hub

A live web application built with Next.js, TypeScript, Tailwind CSS, and MongoDB (via Mongoose) that distributes coupons to guest users in a round-robin manner, incorporating robust abuse prevention mechanisms.

## Live URL

**Deployed Application:** [https://round-robin-coupon-distribution-website.vercel.app](https://round-robin-coupon-distribution-website.vercel.app)

The app is hosted on Vercel, and the root route (`/`) serves the coupon claiming interface.

## Project Overview

### Objective

Develop a web application that:

- Distributes a predefined list of coupons sequentially to ensure even allocation.
- Allows guest access without requiring login or account creation.
- Prevents abuse by restricting claims from the same IP or browser session within a 1-hour window.
- Provides clear feedback to users about claim status and restrictions.

### Features

- **Coupon Distribution:** Assigns coupons in a round-robin order from a MongoDB collection.
- **Abuse Prevention:** Uses IP tracking and cookies to enforce a 1-hour cooldown per user.
- **User Feedback:** Displays success messages, restriction timers, and coupon stats in real-time.
- **Responsive UI:** A detailed, user-friendly interface with Tailwind CSS styling.

## Evaluation Criteria

### Functionality

- **Even Distribution:** Coupons are assigned sequentially using MongoDB's findOneAndUpdate with sorting by _id.
- **Claim Restrictions:** Enforces a 1-hour cooldown per IP and browser session, verified via API and frontend logic.

### Security

- **Abuse Prevention:**
  - **IP Tracking:** Records the client's IP in MongoDB and checks for recent claims within 1 hour.
  - **Cookie Tracking:** Sets an httpOnly and secure (in production) cookie (nextClaimTime) to limit browser session claims.
  - **Mitigation:** Effective against basic evasion tactics like page refreshes; however, IP spoofing or clearing cookies could bypass (see Future Improvements).
- **Database Security:** MongoDB credentials are stored in Vercel environment variables, not in source code.

### User Experience

- **Clarity:** Displays success messages, restriction notices with a ticking timer (e.g., "Time Left: 59:45"), and a "no coupons left" message.
- **Usability:** Includes a stats section (total, claimed, available coupons) and a polished, responsive design.
- **Real-Time Feedback:** Timer updates every second, ensuring users know exactly when they can claim again.

### Code Quality

- **Best Practices:** Uses TypeScript for type safety, modular structure (e.g., `src/lib/mongodb.ts`, `src/models/Coupon.ts`), and error handling.
- **Readability:** Consistent naming, comments in key areas, and logical separation of concerns (API, frontend, models).
- **Maintainability:** Reusable database connection (`connectToDatabase`), clear component structure, and extensible design.

### Documentation

This README provides setup instructions, deployment steps, and testing guidance, ensuring clarity and completeness.

## Setup Instructions

### Prerequisites

- **Node.js:** v18.x or higher
- **PNPM:** v8.x or higher (`npm install -g pnpm`)
- **MongoDB:** A MongoDB Atlas account or local instance
- **Vercel Account:** For deployment
- **GitHub Account:** For forking and deploying

### Local Development

#### Fork and Clone the Repository

```bash
# First, fork the repository on GitHub
# Then clone your fork
git clone https://github.com/yourusername/round-robin-coupon-distribution-website.git
cd round-robin-coupon-distribution-website
```

Replace `yourusername` with your GitHub username.

#### Install Dependencies

```bash
pnpm install
```

#### Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
touch .env.local
```

Add your MongoDB connection string:

```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abc123.mongodb.net/coupon_db?retryWrites=true&w=majority
```

Replace `<username>`, `<password>`, and `cluster0.abc123.mongodb.net` with your MongoDB Atlas credentials.

#### Seed the Database

Ensure your MongoDB instance is running and the `coupon_db` database is created.

Edit `src/scripts/seedCoupons.ts` with your MONGODB_URI and run:

```bash
pnpm seed
```

This populates the `coupons` collection with sample coupons (SAVE10, DISCOUNT20, etc.).

#### Run the Application

```bash
pnpm dev
```

Open [http://localhost:3000/](http://localhost:3000/) to access the app.

### Deployment to Vercel

#### Push to GitHub

Initialize Git (if not already done):

```bash
git init
git add .
git commit -m "Initial commit"
```

Push to your forked repository:

```bash
git remote add origin https://github.com/yourusername/round-robin-coupon-distribution-website.git
git branch -M main
git push -u origin main
```

#### Deploy via Vercel Website

1. Log in to [vercel.com](https://vercel.com).
2. Click "New Project" > "Import Git Repository" > Select your round-robin-coupon-distribution-website repo.
3. Configure:
   - Framework Preset: Next.js (auto-detected).
   - Environment Variables: Add `MONGODB_URI` with your MongoDB connection string.
4. Click "Deploy" and wait for the process to complete.
5. Note the deployed URL (e.g., `https://round-robin-coupon-distribution-website.vercel.app`).

## Testing the Application

### Instructions

- **URL:** [https://round-robin-coupon-distribution-website.vercel.app](https://round-robin-coupon-distribution-website.vercel.app)
- **No Credentials Required:** The app is guest-accessible.
- **Steps:**
  1. Visit the root URL.
  2. Click "Claim Coupon":
     - **Success:** See a coupon (e.g., SAVE10) and a green message.
     - **Refresh:** See a yellow restriction message with a ticking timer (e.g., "Time Left: 59:45").
  3. Claim all 5 coupons (use incognito windows to simulate different IPs): See a red "All coupons have been claimed" message.
  4. Check the "Coupon Stats" section for real-time updates.

### Notes

- **Resetting Coupons:** To test again, manually reset the coupons collection in MongoDB Atlas (delete and re-run `pnpm seed` locally, then redeploy).
- **IP Tracking:** In Vercel's serverless environment, IP detection might be less consistent due to proxying; cookie-based restrictions are the primary limiter.

## Project Structure

```
round-robin-coupon-distribution-website/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── claim/route.ts      # Coupon claiming API
│   │   │   └── stats/route.ts      # Coupon stats API
│   │   └── page.tsx                # Root route (claim interface)
│   ├── lib/
│   │   └── mongodb.ts              # MongoDB connection utility
│   ├── models/
│   │   └── Coupon.ts               # Mongoose coupon schema
│   └── scripts/
│       └── seedCoupons.ts          # Database seeding script
├── .env.local                      # Local environment variables (not committed)
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies and scripts
├── pnpm-lock.yaml                  # PNPM lockfile
├── tailwind.config.js              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

## Dependencies

- **Next.js:** v14.x (App Router)
- **TypeScript:** v5.x
- **Tailwind CSS:** v3.x
- **Mongoose:** v8.x
- **MongoDB:** Cloud-hosted via Atlas

## Future Improvements

- **Enhanced Security:** Add CAPTCHA or rate limiting to counter IP spoofing and cookie clearing.
- **Testing:** Implement unit/integration tests with Jest or Playwright.
- **Admin Panel:** Allow resetting or adding coupons via a secure interface.
- **Analytics:** Track claim patterns for insights.