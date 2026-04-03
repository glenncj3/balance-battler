# CardRank Setup Guide

A step-by-step guide to go from a fresh clone to voting on cards in your browser. This guide assumes you have **Node.js** (v18+) installed and a **GitHub** account, but no prior experience with Supabase or databases.

---

## Table of Contents

1. [Clone and Install](#1-clone-and-install)
2. [Create a Supabase Account and Project](#2-create-a-supabase-account-and-project)
3. [Get Your Database Connection String](#3-get-your-database-connection-string)
4. [Get Your Supabase API Credentials](#4-get-your-supabase-api-credentials)
5. [Create a Storage Bucket for Card Images](#5-create-a-storage-bucket-for-card-images)
6. [Configure Your Environment File](#6-configure-your-environment-file)
7. [Push the Database Schema](#7-push-the-database-schema)
8. [Start the Development Server](#8-start-the-development-server)
9. [Create Your First Game and Set](#9-create-your-first-game-and-set)
10. [Upload Cards](#10-upload-cards)
11. [Start Voting](#11-start-voting)
12. [View the Leaderboard](#12-view-the-leaderboard)
13. [Sharing With Your Team](#13-sharing-with-your-team)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Clone and Install

Open a terminal and run:

```bash
git clone https://github.com/glenncj3/balance-battler.git
cd balance-battler
npm install
```

This will install all dependencies. It may take a minute or two.

---

## 2. Create a Supabase Account and Project

Supabase is a free hosted database and file storage service. It's where all your card data, votes, and images will live so everyone on your team can access them.

### 2a. Create an account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **Start your project** (top right)
3. Sign up with your GitHub account (easiest) or email
4. You'll land on the Supabase Dashboard

### 2b. Create a new project

1. On the dashboard, click the **New Project** button
2. Fill in:
   - **Name**: `cardrank` (or anything you like — this is just a label)
   - **Database Password**: Choose a strong password and **save it somewhere safe** — you'll need this in the next step. You cannot retrieve it later.
   - **Region**: Pick the region closest to you (e.g., "East US" if you're on the US east coast)
3. Click **Create new project**
4. Wait about 60 seconds while Supabase sets up your database

Once it finishes, you'll see your project dashboard. Keep this browser tab open — you'll be copying values from it in the next steps.

---

## 3. Get Your Database Connection String

This is the URL that connects the app to your Supabase database.

1. In your Supabase project dashboard, click **Settings** in the left sidebar (the gear icon near the bottom)
2. Click **Database** in the settings menu
3. Scroll down to the **Connection string** section
4. You'll see a tabbed area with options like **URI**, **PSQL**, etc. Make sure **URI** is selected
5. You'll also see a toggle for **Mode** — select **Transaction** (this uses connection pooling on port 6543, which is what we want)
6. You'll see a connection string that looks like this:

```
postgresql://postgres.[your-project-ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

7. Click the **Copy** button to copy it
8. **Important**: The string contains `[YOUR-PASSWORD]` as a placeholder. Replace it with the **database password you created in step 2b**

Save this full connection string — this is your `DATABASE_URL`.

### Also get the direct connection string

1. Switch the **Mode** toggle to **Session** (this connects directly without pooling)
2. Copy this string too — it will look similar but uses a different hostname and port 5432:

```
postgresql://postgres.[your-project-ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

3. Again, replace `[YOUR-PASSWORD]` with your actual database password

Save this — this is your `DIRECT_DATABASE_URL`. It's used for database migrations only.

---

## 4. Get Your Supabase API Credentials

These let the app upload and serve card images through Supabase Storage.

1. In your Supabase project dashboard, click **Settings** in the left sidebar
2. Click **API** in the settings menu
3. You'll see a section called **Project URL** at the top. It looks like:

```
https://abcdefghijk.supabase.co
```

Copy this — this is your `NEXT_PUBLIC_SUPABASE_URL`.

4. Scroll down to the **Project API keys** section
5. You'll see two keys:
   - **anon / public** — do NOT use this one
   - **service_role** — this is the one you need

6. Click the **Copy** button next to the `service_role` key. It will be a long string starting with `eyJ...`

> **Warning**: The service role key has full access to your database and storage. Never share it publicly or commit it to git. The `.gitignore` file already prevents `.env.local` from being committed.

Save this — this is your `SUPABASE_SERVICE_ROLE_KEY`.

---

## 5. Create a Storage Bucket for Card Images

When you upload card images, they're stored in a Supabase Storage "bucket" — think of it like a folder in the cloud.

1. In your Supabase project dashboard, click **Storage** in the left sidebar (the folder icon)
2. You'll see a page that says "No buckets found" or similar
3. Click **New bucket**
4. Fill in:
   - **Name**: `cardrank` (this must match what you put in your `.env.local` — we'll use `cardrank`)
   - **Public bucket**: **Toggle this ON** — this is important! Card images need to be publicly accessible so voters' browsers can load them. If you leave this off, images won't display.
   - Leave all other settings at their defaults (no file size limit is fine)
5. Click **Create bucket**

You should now see `cardrank` listed under your buckets. It will be empty — images will appear here once you upload cards through the app.

---

## 6. Configure Your Environment File

Now you'll put all those values into a file that the app reads on startup.

1. In the root of your project folder, find the file called `.env.example`
2. **Copy** it and rename the copy to `.env.local`:

```bash
cp .env.example .env.local
```

3. Open `.env.local` in a text editor and fill in each value:

```env
# Paste the Transaction/Pooler connection string from Step 3
DATABASE_URL="postgresql://postgres.abcdefg:YourPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Paste the Session/Direct connection string from Step 3
DIRECT_DATABASE_URL="postgresql://postgres.abcdefg:YourPassword123@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Paste the Project URL from Step 4
NEXT_PUBLIC_SUPABASE_URL="https://abcdefg.supabase.co"

# Paste the service_role key from Step 4
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# This must match the bucket name from Step 5
SUPABASE_STORAGE_BUCKET="cardrank"
```

4. Save the file

### Double-check your work

- `DATABASE_URL` should contain `:6543/` (pooled port)
- `DIRECT_DATABASE_URL` should contain `:5432/` (direct port)
- Both database URLs should have your **actual password**, not `[YOUR-PASSWORD]`
- `NEXT_PUBLIC_SUPABASE_URL` should start with `https://` and end with `.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` should start with `eyJ`
- `SUPABASE_STORAGE_BUCKET` should be `cardrank` (or whatever you named your bucket)

---

## 7. Push the Database Schema

This step creates all the tables (Games, Sets, Cards, Votes, etc.) in your Supabase database.

```bash
npm run db:push
```

You should see output like:

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres"

Your database is now in sync with your Prisma schema.

✔ Generated Prisma Client
```

If you see an error about "Can't reach database server," double-check your `DATABASE_URL` in `.env.local` — the password or hostname is probably wrong.

### Verify in Supabase (optional)

1. Go to your Supabase dashboard
2. Click **Table Editor** in the left sidebar
3. You should see tables listed: `games`, `sets`, `cards`, `votes`, `voter_sessions`, `card_rating_snapshots`
4. They'll all be empty — that's correct

---

## 8. Start the Development Server

```bash
npm run dev
```

You should see:

```
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

Open your browser and go to **http://localhost:3000**

You'll be redirected to the Dashboard page. It will be empty — that's expected. You're running!

---

## 9. Create Your First Game and Set

### Create a Game

1. On the Dashboard, click the **Create Game** button
2. Fill in:
   - **Name**: e.g., `Mythos TCG`
   - **Slug**: e.g., `mythos-tcg` (this is used in URLs — lowercase, hyphens, no spaces)
   - **Description** (optional): e.g., `Our card game balance testing`
3. Click **Create**
4. Your game card will appear on the dashboard. Click on it.

### Create a Set

1. On the Game page, click **Create Set**
2. Fill in:
   - **Name**: e.g., `Core Set`
   - **Slug**: e.g., `core-set` (this becomes the voting URL — pick something short and memorable)
   - **Description** (optional)
3. Click **Create**
4. Click on the set card to enter it

---

## 10. Upload Cards

### Prepare your files

You need two things:

**A) Card images** — One PNG or JPG file per card. Name them descriptively:
- `fire_drake.png`
- `lightning_bolt.png`
- `shadow_paladin.jpg`

**B) A CSV manifest** — A spreadsheet saved as CSV with these columns:

```csv
Name,Rarity,Type,Image,Rating
Fire Drake,Rare,Creature,fire_drake.png,
Lightning Bolt,Common,Spell,lightning_bolt.png,
Shadow Paladin,Mythic,"Creature, Hero",shadow_paladin.jpg,
Healing Spring,Uncommon,"Spell, Environment",healing_spring.png,
```

Column details:
- **Name**: The display name of the card
- **Rarity**: Whatever tiers your game uses (Common, Uncommon, Rare, Mythic, etc.)
- **Type**: Card type(s). Use commas for multiple types: `"Creature, Hero"` (wrap in quotes if it contains commas)
- **Image**: The exact filename of the card image — must match the file you're uploading
- **Rating**: Leave blank for new cards (they start at 1500). Or enter a number to import existing ratings.

> **Tip**: You can create this in Google Sheets or Excel, then File > Download > CSV.

### Upload through the app

1. Navigate to your set and click the **Upload** tab
2. You'll see two drop zones side by side:
   - **Left**: Drag your card image files here (or click to browse)
   - **Right**: Drag your CSV file here (or click to browse)
3. Click **Upload & Validate**
4. The app will cross-reference your CSV against the uploaded images and show you:
   - **Green** = matched (CSV row found a matching image)
   - **Amber** = image with no CSV entry (will be created with default metadata)
   - **Red** = CSV row with no matching image (will be skipped)
5. Review the preview grid, then click **Confirm & Save**

Your cards are now uploaded! You can see them in the **Manage** tab.

> **No CSV?** That's fine — you can upload just images. Cards will be created using the filename as the name, with "Unknown" rarity and type.

---

## 11. Start Voting

### Get the voting link

1. Navigate to your set
2. The voting link is displayed on the set page. It follows this pattern:

```
http://localhost:3000/vote/core-set
```

(where `core-set` is the slug you chose when creating the set)

### Vote on cards

1. Open the voting link in your browser
2. You'll see the **Filter Panel**:
   - Checkboxes for each rarity tier (all checked by default)
   - Checkboxes for each card type (all checked by default)
   - Toggle for "Show card info during voting"
   - Uncheck any rarities or types you want to **exclude** from your matchup pool
3. Click **Start Voting**
4. Two cards appear side by side. Pick the one you think is **stronger** by clicking/tapping it
5. The next pair loads automatically
6. Keep going! Each vote updates the Elo ratings in real time

### Voting controls

| Action | Mouse/Touch | Keyboard |
|--------|------------|----------|
| Pick left card | Click it | `1` or `Left Arrow` |
| Pick right card | Click it | `2` or `Right Arrow` |
| Undo last vote | Click "Undo" (appears for 5 seconds) | `Z` |
| Skip pair | Click "Can't decide — Skip" | `S` |
| Zoom card | Click magnifier icon on card | — |

### How many votes do you need?

For a set of 200 cards with 10 voters, aim for **600-1,500 total votes** to get reliable rankings. That's roughly **60-150 votes per person** — about 30-45 minutes of focused voting.

---

## 12. View the Leaderboard

1. Navigate to your set (or click the **Leaderboard** tab)
2. Cards are ranked by Elo rating, highest to lowest
3. Each card shows:
   - **Rating** — the Elo number (starts at 1500, goes up for strong cards, down for weak)
   - **Confidence** — Low (< 5 comparisons), Medium (5-15), High (> 15)
   - **Balance Zone** — color-coded: red = overpowered, green = balanced, blue = underpowered
   - **Win Rate** — percentage of matchups won

### Export results

Click the export button on the leaderboard to download:
- **CSV** — re-importable format (Name, Rarity, Type, Image, Rating) so you can carry ratings to future sets
- **Full CSV** — includes comparison count, win count, win rate, and confidence
- **JSON** — same data in JSON format

---

## 13. Sharing With Your Team

Since the database and image storage are both on Supabase, sharing is simple.

### For other developers (who run the code)

Each team member needs to:

1. Clone the repo: `git clone https://github.com/glenncj3/balance-battler.git`
2. Install: `cd balance-battler && npm install`
3. Get the `.env.local` file from you (send it privately — never commit it to git)
4. Run: `npm run dev`

Everyone's votes go to the same database. Everyone sees the same leaderboard.

> **Security note**: Only share the `.env.local` with trusted team members. The service role key gives full database access.

### For playtesters (who just vote)

If playtesters aren't running the code locally, you'll need to deploy the app so it's accessible via a public URL. Options:

- **Netlify** (free tier): Connect your GitHub repo, add the environment variables in Netlify's dashboard (Site settings > Environment variables), and deploy
- **Vercel** (free tier): Same approach — connect repo, add env vars, deploy

Once deployed, share the voting link: `https://your-app.netlify.app/vote/core-set`

---

## 14. Troubleshooting

### "Can't reach database server"

- Double-check `DATABASE_URL` in `.env.local`
- Make sure you replaced `[YOUR-PASSWORD]` with your actual Supabase database password
- Make sure the password doesn't contain special characters that need URL encoding (e.g., `@` should be `%40`, `#` should be `%23`)
- Check that your Supabase project is active (free tier projects pause after 1 week of inactivity — go to your Supabase dashboard and click "Restore" if paused)

### "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"

- Make sure both values are set in `.env.local`
- Make sure there are no extra spaces around the `=` sign
- Make sure the file is named exactly `.env.local` (not `.env.local.txt`)
- Restart the dev server after changing `.env.local`

### Images aren't showing up

- Make sure your storage bucket is set to **Public** in Supabase Dashboard > Storage
- Click on your `cardrank` bucket > click the three dots menu > **Edit bucket** > make sure "Public bucket" is toggled on
- Check that `SUPABASE_STORAGE_BUCKET` in `.env.local` matches the bucket name exactly

### "No cards found" after uploading

- Check that your CSV `Image` column matches the exact filenames of your uploaded images (case-sensitive)
- `fire_drake.png` in the CSV must match a file named exactly `fire_drake.png`

### Supabase project is paused

Free Supabase projects pause after 7 days of inactivity:
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click on your project
3. If it's paused, you'll see a banner — click **Restore project**
4. Wait about 60 seconds, then try again

### Port 3000 is already in use

Another process is using port 3000. Either stop it, or run on a different port:

```bash
npm run dev -- --port 3001
```

### How to completely reset

If you want to wipe all data and start fresh:

1. Go to Supabase Dashboard > **SQL Editor**
2. Run this query:

```sql
TRUNCATE games CASCADE;
```

3. Go to Supabase Dashboard > **Storage** > your `cardrank` bucket
4. Select all files and delete them

This removes all games, sets, cards, votes, and uploaded images.

---

## Quick Reference

| What | Command |
|------|---------|
| Install dependencies | `npm install` |
| Create database tables | `npm run db:push` |
| Start dev server | `npm run dev` |
| Run tests | `npm test` |
| Build for production | `npm run build` |
| Open database GUI | `npm run db:studio` |

| What | URL |
|------|-----|
| Dashboard | `http://localhost:3000/dashboard` |
| Voting page | `http://localhost:3000/vote/{your-set-slug}` |
| Supabase Dashboard | `https://supabase.com/dashboard` |
