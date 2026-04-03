# CardRank — TCG Balance Testing Platform

## Design Document & Phased Development Plan

---

## 1. Product Overview

**CardRank** is an internal web application for a game development team to upload trading card game (TCG) sets and crowdsource pairwise "A vs. B" comparisons from playtesters. These comparisons feed into an Elo-based rating system that produces a dynamic power-ranking leaderboard — surfacing which cards are perceived as overpowered, underpowered, or well-balanced relative to the rest of the set.

This is a team tool, not a commercial SaaS product. Authentication and onboarding are optimized for a small group of known developers, not public sign-up.

### Core User Flow

1. **Developer** creates a **Game**, then creates one or more **Sets** within that game.
2. **Developer** uploads card images (PNGs, JPGs, or a multi-page PDF) alongside a **CSV manifest** that maps each image to its card name, rarity, type, and optionally a pre-existing Elo rating.
3. **Developer** shares a voting link with playtesters.
4. **Voters** open the link, optionally filter the matchup pool by rarity and/or type using on-screen checkboxes, and then pick which card is stronger in a simple A vs. B interface.
5. After a critical mass of votes, the **Leaderboard** stabilizes into a reliable power ranking.
6. **Developer** reviews the leaderboard and analytics, then **exports an updated CSV** (with current ratings) to carry forward into future sets or balance patches.

### Data Hierarchy

```
Game (e.g., "Mythos TCG")
 └── Set (e.g., "Core Set", "Expansion 1", "Beta v2.3")
      └── Card (image, name, rarity, type, Elo rating)
```

A single team account can own multiple games. Each game contains one or more sets. Cards belong to exactly one set. Votes and Elo ratings are calculated per-set only — there is no cross-set voting. If the team wants to compare cards across sets, they create a new set containing all relevant cards and import a CSV with their existing ratings.

### Key Personas

- **Developer (Team Member):** Creates games and sets, uploads cards via CSV + images, reviews leaderboard and analytics, exports data. Authenticated user.
- **Voter (Playtester):** Opens a shared link, configures optional matchup filters, picks winners. No account required.

---

## 2. Information Architecture

```
/                                  → Landing page (minimal — internal tool)
/login                             → Team authentication
/dashboard                         → Game list
/game/:gameId                      → Game overview (list of sets)
/game/:gameId/settings             → Game-level settings, team members
/game/:gameId/set/:setId           → Set overview + leaderboard
/game/:gameId/set/:setId/upload    → Card upload (CSV + images)
/game/:gameId/set/:setId/manage    → Card management grid
/game/:gameId/set/:setId/analytics → Balance analytics & insights
/game/:gameId/set/:setId/settings  → Voting config, sharing, set settings
/vote/:setSlug                     → Public voting interface (no auth)
```

---

## 3. Feature Specification

### 3.1 Card Upload & the CSV Manifest

The CSV is the **primary** mechanism for associating metadata with card images. Manual editing exists as a fallback for quick fixes, but the intended workflow is: prepare a CSV, upload it with your images, done.

**CSV Format:**

| Name | Rarity | Type | Image | Rating |
|---|---|---|---|---|
| Fire Drake | Rare | Creature | fire_drake.png | |
| Lightning Bolt | Common | Spell | lightning_bolt.png | 1620 |
| Shadow Paladin | Mythic | Creature, Hero | shadow_paladin.png | 1580 |
| Healing Spring | Uncommon | Spell, Environment | healing_spring.png | |

**Column definitions:**

- **Name** (required): Display name of the card.
- **Rarity** (required): Free-text rarity tier (e.g., "Common", "Rare", "Mythic" — whatever the game uses). Used for leaderboard display and voter filtering.
- **Type** (required): Card type(s). May contain multiple types separated by commas (e.g., "Creature, Hero"). Values are **normalized on import** — trimmed of whitespace and converted to title case — so "creature,  Hero" and "Creature, Hero" are treated identically. Filtering uses a **token-level contains** check — if a voter filters to "Creature", cards whose type list includes the token "Creature" will match (so both "Creature" and "Creature, Hero" are included, but "Firewall" would not match "Fire").
- **Image** (required): Filename of the corresponding image file. Must exactly match a file in the uploaded batch.
- **Rating** (optional): Pre-existing Elo rating to import. If blank, the card starts at the default rating of 1500. This allows developers to carry forward ratings from a previous set or balance pass — upload a new set with updated card images but retain historical strength data.

**Upload UI — Two-Zone Form:**

The upload page (`/game/:gameId/set/:setId/upload`) is a single screen with two side-by-side dropzones and a submit button:

```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│                             │  │                             │
│   Drop card images here     │  │   Drop CSV manifest here    │
│   (PNG, JPG, or one PDF)    │  │   (.csv file)               │
│                             │  │                             │
│   or click to browse        │  │   or click to browse        │
│                             │  │                             │
│   ✓ 47 files selected       │  │   ✓ core_set.csv loaded     │
│                             │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘

                    [ Upload & Validate ]
```

- **Left zone** accepts multiple image files (PNG/JPG) via drag-and-drop or file picker, or a single PDF. Displays a count of selected files (or "1 PDF selected" for PDFs). The developer can clear and re-select before submitting.
- **Right zone** accepts a single CSV file. When dropped, the file is parsed client-side (via `papaparse`) and a summary is shown inline: row count, detected columns, and any obvious format issues (missing required columns, empty rows). The developer can clear and re-select.
- **Upload & Validate** button is only enabled when the left zone has files. The right zone (CSV) is optional — if empty, the system creates cards from filenames with default metadata.

**Validation Step (after clicking Upload & Validate):**

Files and CSV are sent to the server. The system cross-references the CSV's `Image` column against the uploaded filenames and reports results:

- **Matched:** CSV rows where the `Image` value exactly matches an uploaded filename. Shown in green.
- **Unmatched CSV rows:** CSV rows whose `Image` value doesn't correspond to any uploaded file. Shown in red with the message: "No image found for `{filename}`." These cards will not be created.
- **Unmatched images:** Uploaded image files that don't appear in any CSV row. Shown in amber with the message: "No CSV entry for `{filename}` — will be created with default metadata." These cards are created using the filename as the label, "Unknown" rarity, "Unknown" type, and 1500 rating.
- **Duplicate `Image` values** in the CSV are flagged as errors.

**Preview Grid:**

After validation, a scrollable preview grid shows every card that will be created: thumbnail, name, rarity, type, imported rating (or "1500 default"), and match status (green/amber). The developer reviews, then clicks **Confirm & Save** or **Cancel**.

On confirm, images are uploaded to object storage (S3 / Cloudflare R2) and thumbnails are generated at two sizes: 400px (voting UI, large enough to read card text) and 80px (leaderboard/admin grid). Card records are written to the database.

**PDF handling:** When a PDF is dropped in the left zone, the system extracts each page as a separate image and auto-names them `page_1.png`, `page_2.png`, etc. The CSV's `Image` column should reference these generated filenames. During the validation step, extracted pages are shown as thumbnails alongside their page numbers so the developer can verify the mapping. A preview step shows the extracted pages before confirming.

### 3.2 Card Management

- Grid view of all cards in the set, sortable by name, rarity, type, or rating.
- Inline editing: click any field (name, rarity, type) to edit it directly.
- Bulk select + bulk edit: select multiple cards and set rarity or type for all at once.
- **Re-import CSV:** Upload a new CSV to overwrite metadata for existing cards (matched by `Image` filename). This is the fastest way to make bulk corrections.
- Delete individual cards or bulk-select and delete.
- **Replace image:** Swap a card's art without losing its vote history or rating. A before/after thumbnail is shown for visual confirmation. An optional "reset this card's rating" checkbox is available if the card was fundamentally redesigned (not just a cosmetic tweak).
- Card count displayed prominently, with breakdown by rarity and type.

### 3.3 CSV Export

At any time, the developer can export the current set as a CSV with the same format used for import:

| Name | Rarity | Type | Image | Rating |
|---|---|---|---|---|
| Fire Drake | Rare | Creature | fire_drake.png | 1487 |
| Lightning Bolt | Common | Spell | lightning_bolt.png | 1702 |
| Shadow Paladin | Mythic | Creature, Hero | shadow_paladin.png | 1553 |

The `Rating` column now contains the current Elo rating as calculated from all votes. This exported CSV can be directly used as the import CSV for a new set — allowing developers to carry ratings forward across balance iterations.

**Additional export options:**
- Full data export (CSV or JSON) includes extra columns: `Comparison_Count`, `Win_Count`, `Win_Rate`, `Confidence`.
- Raw vote log export: every individual vote record for deeper offline analysis.

### 3.4 Voting Interface (`/vote/:setSlug`)

**Pre-Vote Filter Panel:**

Before voting begins, the voter sees a configuration panel with:

- **Rarity checkboxes:** One checkbox per unique rarity value in the set (e.g., ☑ Common ☑ Uncommon ☑ Rare ☑ Mythic). All checked by default. The voter unchecks any rarities they want to exclude from their matchup pool.
- **Type checkboxes:** One checkbox per unique type token in the set (e.g., ☑ Creature ☑ Spell ☑ Equipment ☑ Hero ☑ Environment). All checked by default. Type filtering uses **token-level contains** matching — unchecking "Creature" removes any card whose comma-separated type list includes the token "Creature" (so both "Creature" and "Creature, Hero" are removed, but "Firewall" is unaffected).
- **Metadata visibility toggle:** "Show card info during voting" — if enabled, the card's name, rarity, and type are displayed beneath each card image during matchups. Default state is set by the creator in set settings (off by default).
- A "Start Voting" button that locks in the filter and begins the session.

Voters can return to the filter panel at any time to adjust their pool.

**Voting Layout:**

Two cards displayed side-by-side (desktop) or stacked with large tap targets (mobile). A clear "VS" divider separates them. The voter taps/clicks the card they believe is stronger.

- **Tap-to-zoom:** Tapping and holding (or clicking) a card opens a full-screen lightbox so voters can read card text clearly. This is essential for text-heavy TCG cards on mobile. The lightbox closes on tap/click, returning to the comparison view without registering a vote.
- After voting, the next pair loads immediately with a smooth card-flip or slide transition.
- **Undo button:** A small "Undo" link appears for 5 seconds after each vote, allowing the voter to reverse a mis-tap. The undone vote is soft-deleted and the Elo adjustment is rolled back.
- **Skip button:** "Can't decide" — skips the pair without recording a winner (recorded separately for analytics).
- **Session counter:** Shows total votes cast this session.
- Keyboard shortcuts: `1` or `←` for left card, `2` or `→` for right card, `Z` for undo, `S` for skip.

**Pair Selection Algorithm:**

- Uses an **information-gain heuristic**: prioritizes matchups where the rating difference between two cards has the highest uncertainty, or where one or both cards have few comparisons. This converges the leaderboard faster than random selection.
- Pairs are drawn **only** from the voter's filtered pool (respecting rarity/type checkbox selections).
- Constraint: never show the same voter the same pair twice.
- Constraint: avoid showing the same card more than 3 times in a row to one voter.
- For sets of 100–300 cards with a team of 10 expert voters, the system should reach reliable rankings (High confidence on most cards) within approximately 600–1,500 total votes.

**Optional "Why?" Quick Tags:**

After picking a winner, an optional (collapsible) row of quick-tap reason tags appears: "Better stats," "Better ability," "Better synergy," "Better cost," "Just stronger overall." This is not free text — just single-tap tags. Selecting one is optional and doesn't block the next pair from loading. These tags are recorded alongside the vote and surfaced in analytics to give the creator qualitative signal alongside quantitative rankings. Tag labels are configurable by the creator in set settings.

### 3.5 Rating Algorithm

**Primary: Elo Rating System**

Each card starts with a default rating of 1500 (or the value imported from the CSV). After each comparison:

```
E_a = 1 / (1 + 10^((R_b - R_a) / 400))
E_b = 1 / (1 + 10^((R_a - R_b) / 400))

// If Card A wins:
R_a_new = R_a + K * (1 - E_a)
R_b_new = R_b + K * (0 - E_b)
```

**K-factor:** Starts at 40 for new cards (fewer than 15 comparisons) and decays to 20 as comparisons increase past 15. This lets early votes move ratings quickly while stabilizing as confidence grows. Cards imported with a pre-existing rating start with K=32 (slightly reduced, since they aren't truly "new").

**Confidence Metric:** Based on comparison count per card. Because voters are the development team itself (not anonymous public users), each vote carries higher signal — these are informed assessments from people who deeply understand the game's mechanics. Confidence thresholds reflect this:
- **Low:** < 5 comparisons
- **Medium:** 5–15 comparisons
- **High:** > 15 comparisons

Cards with "Low" confidence are flagged on the leaderboard. For a team of 10 developers working on a 200-card set, reaching "High" confidence on all cards requires roughly 600–1,500 total votes (approximately 60–150 votes per team member). A focused session of 30–45 minutes per developer should be sufficient to reach meaningful rankings.

**Undo handling:** When a voter undoes a vote, the Elo adjustments from that vote are reversed. Each vote record stores the pre-vote ratings for both cards (`card_a_pre_elo`, `card_b_pre_elo`), so rollback is a simple restore — no need to recalculate the entire chain. The undone vote is soft-deleted (flagged `undone = true`), not hard-deleted, for audit purposes.

**Future consideration:** Upgrade to **Glicko-2** for more statistically rigorous confidence intervals and rating deviation tracking.

### 3.6 Leaderboard

**Default View:** A ranked list of all cards in the set, sorted by Elo rating descending. Each row shows:

- Rank number
- Card thumbnail (clickable to zoom)
- Card name
- Rarity badge (colored — e.g., gold for "Mythic", purple for "Rare", silver for "Uncommon", gray for "Common"; colors auto-assigned per unique rarity value)
- Type label
- Elo rating (numerical)
- Visual rating bar (filled proportionally relative to the highest and lowest rated cards)
- Confidence indicator (Low / Medium / High)
- Total comparisons
- Win rate percentage

**Features:**

- **Balance Zones:** Color-coded background bands — red (overpowered: > 1.5 standard deviations above mean), green (balanced: within 1 SD), blue (underpowered: > 1.5 SD below mean). Thresholds configurable in set settings.
- **Filter by Rarity:** Checkboxes to show/hide cards by rarity tier.
- **Filter by Type:** Checkboxes using the same token-level contains-match logic as voting filters.
- **Rarity Breakdown View:** Toggle to see separate mini-leaderboards per rarity tier, so creators can evaluate balance *within* a power band (e.g., "Are all our Rares roughly equal, or is one dominant?").
- **Type Breakdown View:** Same concept, grouped by type.
- **Minimum Vote Threshold:** A set-level setting that hides a card's rank and rating on the public leaderboard until it reaches N comparisons (default: 10). Prevents premature conclusions from insufficient data. Team members always see full data regardless.
- **Search:** Filter by card name.
- **Export:** Download as CSV (with ratings, for re-import) or full-data CSV/JSON.
- **Shareable Link:** Public read-only leaderboard URL.

### 3.7 Analytics Dashboard (Team Only)

- **Rating Distribution Histogram:** Spread of Elo ratings across the set, optionally segmented by rarity or type. A healthy set shows each rarity tier in its own band (Mythics clustered higher than Commons, but without extreme outliers within a tier).
- **Convergence Chart:** Line graph of each card's Elo rating over time (by vote count). When lines flatten, the data is reliable. Filterable by rarity/type.
- **Head-to-Head Matrix:** Heatmap showing win rates for every card pair. For sets of 100–300 cards, this matrix is large (10,000–90,000 cells) — the UI should support search, zoom, and sorting by a selected card's row. Most cells will be empty (not every pair will have been compared), and empty cells should be visually distinct.
- **Vote Velocity:** Votes per hour/day over time. Useful for tracking playtester engagement after sharing a vote link.
- **Outlier Detection:** Automatically flags cards whose rating is > 2 standard deviations from the mean overall, *and* > 2 SD from the mean within their rarity tier.
- **Decision Time Analysis:** Average time-to-decide per card. Cards where voters consistently decide quickly may indicate obvious power gaps; slow decisions may indicate close balance.
- **"Why?" Tag Summary:** For each card, a breakdown of the reason tags it received when it won and when it lost. If a card frequently wins with "Better ability," that tells the team specifically *what* makes it strong.
- **Voter Session Summary:** Unique voter count, average votes per session, voter retention (how many completed 20+ comparisons vs. dropping off after a few).
- **Rarity vs. Rating Scatter Plot:** Plots each card as a dot with rarity tier on the X axis and Elo rating on the Y axis. Quickly reveals whether rarity tiers correspond to actual perceived power, and which individual cards break the pattern.

### 3.8 Game & Set Settings

**Game-level settings:**
- Game name, description, slug.
- Team member management (add/remove by email, assign roles: owner / editor / viewer).
- Game-wide visibility: private (team only) or public.

**Set-level settings:**
- **Voting Link:** Shareable URL (`cardrank.app/vote/my-core-set`).
- **Voting Toggle:** Open/close voting. When closed, the voting page shows a "Voting is paused" message.
- **Default Metadata Visibility:** Whether the "Show card info during voting" toggle defaults to on or off for new voter sessions.
- **Minimum Vote Threshold:** Number of comparisons required before a card's rank is visible on the public leaderboard (default: 10).
- **Balance Zone Thresholds:** Customize the standard deviation cutoffs for the red/green/blue balance zones.
- **Voter Limits:** Optional cap on votes per voter session (e.g., max 200 comparisons).
- **"Why?" Tags:** Enable/disable the optional reason tags after each vote. Customize the tag labels (default: "Better stats, Better ability, Better synergy, Better cost, Just stronger overall").
- **Reset Ratings:** Wipe all votes and reset all cards to their imported (or default 1500) ratings.
- **Set Visibility:** Private (team only) or public leaderboard.

---

## 4. Technical Architecture

### 4.1 Stack Recommendation

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js (React) + Tailwind CSS | SSR for public pages, fast SPA for voting |
| Backend / API | Next.js API Routes | Simple, co-located with frontend; sufficient for internal team scale |
| Database | PostgreSQL | Relational data (cards, votes, ratings), strong query support |
| File Storage | Cloudflare R2 or AWS S3 | Cost-effective object storage for card images |
| PDF Processing | `pdf-lib` + `sharp` (Node) | Page extraction and thumbnail generation |
| CSV Parsing | `papaparse` (client-side preview) + server-side validation | Fast preview, robust validation |
| Auth | NextAuth.js with email/password or SSO | Team accounts; simple internal auth |
| Hosting | Vercel + managed Postgres (Neon or Supabase) | Low-ops, more than sufficient for team-scale traffic |
| Caching | In-memory or Redis (Phase 4+) | Cache leaderboard rankings, rate-limit voters |

### 4.2 Data Model (Core Tables)

```
users
  id              UUID  PK
  email           VARCHAR  UNIQUE
  password_hash   VARCHAR
  display_name    VARCHAR
  created_at      TIMESTAMP

games
  id              UUID  PK
  creator_id      UUID  FK → users
  name            VARCHAR
  slug            VARCHAR  UNIQUE
  description     TEXT
  visibility      VARCHAR  DEFAULT 'private'   ('private' | 'public')
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

game_members
  game_id         UUID  FK → games
  user_id         UUID  FK → users
  role            VARCHAR  DEFAULT 'editor'     ('owner' | 'editor' | 'viewer')
  PRIMARY KEY (game_id, user_id)

sets
  id              UUID  PK
  game_id         UUID  FK → games
  name            VARCHAR
  slug            VARCHAR  UNIQUE
  description     TEXT
  voting_open     BOOLEAN  DEFAULT true
  default_show_metadata  BOOLEAN  DEFAULT false
  min_vote_threshold     INTEGER  DEFAULT 10
  balance_zone_sd        FLOAT    DEFAULT 1.5
  voter_limit            INTEGER  NULL            (NULL = unlimited)
  why_tags_enabled       BOOLEAN  DEFAULT true
  why_tag_labels         TEXT[]   DEFAULT '{Better stats,Better ability,Better synergy,Better cost,Just stronger overall}'
  visibility      VARCHAR  DEFAULT 'private'
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

cards
  id              UUID  PK
  set_id          UUID  FK → sets
  name            VARCHAR
  rarity          VARCHAR                        (free-text: "Common", "Rare", etc.)
  card_type       VARCHAR                        (free-text, comma-separated: "Creature, Hero")
  image_filename  VARCHAR                        (original filename — CSV matching key)
  image_url       VARCHAR                        (S3/R2 URL)
  thumbnail_lg    VARCHAR                        (400px thumbnail URL)
  thumbnail_sm    VARCHAR                        (80px thumbnail URL)
  elo_rating      FLOAT    DEFAULT 1500
  imported_rating FLOAT    NULL                  (preserved for reset-to-import)
  comparison_count INTEGER DEFAULT 0
  win_count       INTEGER  DEFAULT 0
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

votes
  id              UUID  PK
  set_id          UUID  FK → sets
  card_a_id       UUID  FK → cards
  card_b_id       UUID  FK → cards
  winner_id       UUID  FK → cards               (NULL if skipped)
  voter_session   VARCHAR                        (anonymous session fingerprint)
  decision_time_ms INTEGER
  card_a_pre_elo  FLOAT                          (pre-vote rating — enables undo rollback)
  card_b_pre_elo  FLOAT                          (pre-vote rating — enables undo rollback)
  why_tag         VARCHAR  NULL                  (reason tag, if provided)
  undone          BOOLEAN  DEFAULT false         (soft-delete for undone votes)
  created_at      TIMESTAMP

voter_sessions
  id              VARCHAR  PK                    (session fingerprint)
  set_id          UUID  FK → sets
  rarity_filter   TEXT[]   NULL                  (active rarity checkboxes; NULL = all)
  type_filter     TEXT[]   NULL                  (active type checkboxes; NULL = all)
  show_metadata   BOOLEAN
  votes_cast      INTEGER  DEFAULT 0
  created_at      TIMESTAMP
  last_active     TIMESTAMP
```

### 4.3 API Endpoints

```
Auth
  POST   /api/auth/login                          Log in
  POST   /api/auth/logout                         Log out

Games
  POST   /api/games                               Create game
  GET    /api/games                               List user's games
  GET    /api/games/:gameId                       Game details + set list
  PATCH  /api/games/:gameId                       Update game settings
  POST   /api/games/:gameId/members               Add team member
  DELETE /api/games/:gameId/members/:userId        Remove team member

Sets
  POST   /api/games/:gameId/sets                  Create set
  GET    /api/games/:gameId/sets/:setId           Set details
  PATCH  /api/games/:gameId/sets/:setId           Update set settings
  DELETE /api/games/:gameId/sets/:setId           Delete set (with confirmation)
  POST   /api/games/:gameId/sets/:setId/duplicate Duplicate ("fork") set

Cards
  POST   /api/sets/:setId/cards                   Upload cards (multipart: images + CSV)
  POST   /api/sets/:setId/cards/reimport-csv      Re-import CSV to update metadata
  GET    /api/sets/:setId/cards                   List all cards in set
  PATCH  /api/sets/:setId/cards/:cardId           Update individual card fields or replace image
  DELETE /api/sets/:setId/cards/:cardId           Delete card
  POST   /api/sets/:setId/cards/:cardId/reset     Reset card rating to imported or default value

Voting
  GET    /api/vote/:setSlug/config                Set config (rarities, types, metadata toggle default, why tags)
  GET    /api/vote/:setSlug/pair?rarity=X&type=Y  Next card pair (respects active filters)
  POST   /api/vote/:setSlug                       Submit vote ({ winner_id, decision_time_ms, why_tag? })
  POST   /api/vote/:setSlug/undo                  Undo last vote ({ vote_id })
  POST   /api/vote/:setSlug/skip                  Record a skip ({ card_a_id, card_b_id })

Leaderboard & Export
  GET    /api/sets/:setId/leaderboard             Ranked card list (?rarity=&type=&min_votes=)
  GET    /api/sets/:setId/analytics               Analytics data
  GET    /api/sets/:setId/export/csv              Export re-importable CSV (Name, Rarity, Type, Image, Rating)
  GET    /api/sets/:setId/export/full             Export full data CSV/JSON (all stats)
  GET    /api/sets/:setId/export/votes            Export raw vote log
```

### 4.4 Type Filtering Logic (Implementation Note)

Because the `card_type` field may contain multiple comma-separated tokens (e.g., "Creature, Hero"), filtering must operate at the **token level**, not as a substring search. All type values are **normalized on import** — trimmed of whitespace and converted to title case — so filtering is always consistent regardless of how the CSV was formatted.

```
// Normalization (applied once on CSV import):
"creature,  Hero" → split on comma → trim each → title case → ["Creature", "Hero"]
"CREATURE"        → ["Creature"]
"spell, environment" → ["Spell", "Environment"]

// Stored in database as normalized comma-separated string:
card_type = "Creature, Hero"

// Filter check at query time:
selectedTypes = ["Creature"]
cardTokens = ["Creature", "Hero"]
match = cardTokens.some(token => selectedTypes.includes(token))  // true

// Edge case protection:
// "Firewall" does NOT match filter "Fire"
// because "Firewall" is a single token, not split further
```

The same normalization is applied to rarity values on import (trimmed, title case).

The voting config endpoint (`/api/vote/:setSlug/config`) returns a deduplicated, alphabetically sorted list of all unique type tokens across all cards in the set, for rendering the checkbox list.

---

## 5. Phased Development Plan

### Phase 1 — MVP Core (Weeks 1–3)

**Goal:** A working end-to-end loop: upload cards with CSV → vote → see leaderboard → export updated CSV.

**Deliverables:**
- Team authentication (email/password login for developers).
- Game creation (name, slug). Set creation within a game.
- **Two-zone upload form:** Left dropzone for images (PNG/JPG only, no PDF yet), right dropzone for CSV manifest. Client-side CSV preview via `papaparse`. Server-side cross-reference validation with green/red/amber match status. Preview grid with Confirm & Save.
- Card management grid: view all cards, inline edit name/rarity/type, delete, bulk select.
- Voting page: anonymous access via set slug. Simple random pair selection (no information-gain optimization yet). Submit vote, auto-advance to next pair.
- **Tap-to-zoom** on voting cards (lightbox on tap-and-hold / click).
- Elo calculation: runs synchronously on each vote, respecting imported ratings.
- Leaderboard: ranked list with name, rarity badge, type, rating, win rate, comparison count. Team-only access.
- **CSV export** with current ratings (re-importable format).
- Basic responsive layout (mobile-first voting).

**Tech milestone:** Deployed to production. A developer can upload a set via CSV, share a voting link, and export updated ratings.

---

### Phase 2 — Voter Filters, PDF & Polish (Weeks 4–5)

**Goal:** Filtered voting pools, PDF uploads, and a polished voting experience.

**Deliverables:**
- **Voter filter panel:** Rarity and type checkboxes on the voting page. Token-level contains-match logic for multi-type cards. All checked by default; voter deselects to narrow the matchup pool.
- **Metadata visibility toggle** on voting page (default configurable in set settings).
- PDF upload: server-side page extraction, mapped to CSV via auto-generated `page_N.png` filenames. Preview step before saving.
- Improved pair selection: information-gain heuristic within the voter's filtered pool. No repeat pairs per voter. Max 3 appearances in a row per card.
- **Undo button:** 5-second window after each vote. Elo rollback via stored pre-vote ratings. Soft-delete for audit.
- **Skip button** with skip tracking.
- Voting UX polish: card transitions, keyboard shortcuts (←/→, 1/2, Z, S), session vote counter.
- Leaderboard: confidence indicators, balance zones, filter by rarity/type, rarity breakdown view, type breakdown view.
- **Minimum vote threshold** setting.
- Shareable public leaderboard URL.

---

### Phase 3 — Analytics & Insights (Weeks 6–7)

**Goal:** Actionable balance data beyond a simple ranked list.

**Deliverables:**
- Rating distribution histogram (overall and segmented by rarity/type).
- Convergence chart (Elo over time per card, filterable).
- Head-to-head win-rate matrix (heatmap with search/zoom for 100–300 card sets).
- Outlier detection: flags cards > 2 SD from the mean overall *and* within their rarity tier.
- Decision time analytics per card.
- Vote velocity tracking.
- Voter session summary (unique voters, avg votes per session, drop-off rate).
- **Rarity vs. Rating scatter plot** (rarity tiers on X, Elo on Y — reveals whether rarity aligns with perceived power).
- Full data export (CSV/JSON) and raw vote log export.

---

### Phase 4 — "Why?" Tags, Collaboration & Scale (Weeks 8–10)

**Goal:** Qualitative feedback, team features, and operational polish.

**Deliverables:**
- **"Why?" quick tags** after each vote (configurable labels). Tag breakdown per card in analytics.
- Team member management: invite by email, assign roles (owner / editor / viewer) per game.
- CSV re-import: bulk-update metadata for existing cards without losing vote history.
- **Card image replacement** with before/after preview and optional rating reset.
- **Set duplication:** "Fork this set" — copies all cards and optionally their current ratings into a new set.
- Voter rate limiting and anti-spam (fingerprint hardening, optional CAPTCHA).
- Notification system: alerts when vote milestones are reached.

---

### Phase 5 — Advanced Rating & Comparison Modes (Weeks 11–13)

**Goal:** Sophisticated statistical models and flexible comparison formats.

**Deliverables:**
- Upgrade to **Glicko-2** rating system with proper rating deviation and volatility. Confidence intervals on leaderboard replace the simple Low/Medium/High metric.
- **Comparison modes:** Standard ("which is stronger?"), Thematic ("which has better art?", "which is more fun?"), Custom prompt (developer defines the question). Each mode maintains its own separate Elo track.
- **Multi-set diff view:** Select two sets within the same game, compare how card ratings shifted. Visual diff: rank changes, rating deltas, biggest movers. Useful for measuring the impact of a balance patch.
- **Voter segmentation (optional):** Voters self-identify experience level before voting. Leaderboard filterable by voter segment.

---

## 6. Design Principles

1. **CSV-first workflow.** The CSV manifest is the source of truth for card metadata. Upload with CSV, export with CSV, re-import with CSV. Manual editing is a convenience, not the primary path.
2. **Ratings are portable.** CSV export → CSV import means ratings travel seamlessly across sets and balance iterations. No data is ever trapped.
3. **Voting must be frictionless.** No sign-up, no tutorial. The voter sees filter checkboxes, taps "Start," and picks cards. Everything else is invisible.
4. **Every vote should count.** Information-gain pair selection plus voter-controlled filters ensure comparisons are meaningful. Comparing within a rarity tier is more useful than Common vs. Mythic.
5. **The leaderboard is the product.** Every feature exists to make the leaderboard more accurate, more trustworthy, and more actionable.
6. **Mobile-first voting.** Tap-optimized layout, tap-to-zoom for card text, large hit targets, no horizontal scrolling.
7. **Progressive complexity.** The MVP is dead simple. Advanced features layer on without complicating the core flow.

---

## 7. Open Questions & Risks

- **Vote manipulation:** Anonymous voting is gameable. Mitigation: session fingerprinting, voter rate limits, statistical detection of suspicious patterns (e.g., voters who always pick the left card, or vote faster than humanly possible). For an internal tool with a known pool of playtesters, this risk is lower than for a public product.
- **Card legibility:** Text-heavy cards may be hard to read on mobile. Tap-to-zoom is specced in Phase 1. The team should upload high-resolution images (at least 600px wide) for best results.
- **Set size scaling:** For 100–300 card sets, the unique pair space is 5,000–45,000. With 10 expert voters, reaching High confidence on most cards requires roughly 600–1,500 total votes. The system should display a progress estimate ("~400 more votes needed for full confidence") to help the team plan voting sessions.
- **PDF fidelity:** Multi-page PDFs vary wildly. The preview-before-saving step is the primary safeguard against bad extraction.
- **Rating interpretation:** Small Elo differences are noise. The UI should clearly communicate this via balance zones and confidence indicators. The team should establish an internal threshold for "actionable gap" (e.g., > 150 points from rarity tier mean).

---

*Document version: 2.1 — April 2026*
