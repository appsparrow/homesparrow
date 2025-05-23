# HomeReview

A web application to manage and review potential homes with Zillow integration.

## Features

- **Address List Panel:** Save and view your property addresses with criteria-matching highlights
- **Zillow Viewer:** View Zillow property listings directly within the app (or open in a new tab)
- **Checklist Panel:** Track criteria for each home (3 bed, 2 bath, etc.)

## Tech Stack

- Frontend: React (with Vite), TypeScript, TailwindCSS
- Database: Supabase (PostgreSQL)

## Setup Instructions

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd homereview
```

2. Install dependencies
```bash
npm install
```

3. Create a Supabase project and set up the database tables:

Create two tables in your Supabase dashboard:

**homes**
- id (uuid, primary key)
- address (text)
- zillow_url (text)
- created_at (timestamp with timezone)

**home_checklists**
- id (uuid, primary key)
- home_id (uuid, foreign key to homes.id)
- three_bed (boolean)
- two_bath (boolean)
- under_200k (boolean)
- no_basement (boolean)
- no_trees_back (boolean)
- brick (boolean)
- updated (boolean)
- ranch (boolean)
- notes (text)

4. Update the Supabase configuration in `src/lib/supabase.ts` with your project URL and anon key.

5. Start the development server
```bash
npm run dev
```

The app will be available at http://localhost:5173/

## Usage

1. Add homes with their addresses and Zillow URLs
2. Select a home to view its Zillow listing
3. Update the checklist for each home
4. Homes that meet all criteria will be highlighted with a green border
# homesparrow
