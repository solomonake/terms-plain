# Termsplain Frontend

## How to run

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Manual test checklist

- Start the backend on http://localhost:4000
- Start the frontend with `npm run dev`
- Go to `/` and paste sample lease text, then click “Analyze Lease”
- Confirm summary bullets and flags render from the backend response
- Ask a question in the Q&A section and confirm answer + confidence render
- Go to `/explain`, paste a clause, click “Explain Clause”, and confirm results render
- Summary label visible
- Explain label visible
- Q&A “Where this comes from” visible
- Empty states trigger correctly
- No layout shifts

## Manual UI Checklist

- Summary shows trust label
- Q&A shows “Where this comes from”
- Empty states show correctly
- Explain shows trust label
- Exit Board unchanged

## Exit Board MVP

The Exit Board feature allows renters to post lease takeover listings using localStorage only (no backend, no authentication).

### Features

**Browse Listings:**
- View all posted exit listings
- Filter by city, max rent, and housing type
- Sort by rent (low/high), earliest move-in, or soonest lease end
- Click any listing to view full details

**Post a Listing:**
- Required fields: City, State, Rent, Lease end date, Earliest move-in date, Bedrooms/bathrooms, Housing type, Description, Contact info
- Optional fields: Neighborhood, Security deposit, Reason for leaving
- Character limits: Description (500 chars), Contact (100 chars)
- Date validation: Move-in date must be before lease end date
- Required confirmations before posting

**Listing Details:**
- View full listing information
- Copy contact info to clipboard
- Delete listing (no auth, anyone can delete)
- Report listing (UI placeholder only)

### Data Storage

All Exit Board data is stored in browser localStorage under the key `termsplain_exit_listings_v1`.

**Important Notes:**
- Data persists only in the user's browser
- Clearing browser data will delete all listings
- No server backup or synchronization
- No user authentication or ownership verification
- Anyone can delete any listing

### Manual Testing

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to Exit Board:**
   - Open http://localhost:3000
   - Click "Exit Board" in the navigation

3. **Post a Listing:**
   - Click "Post an Exit" button
   - Fill in all required fields:
     - City: "San Francisco"
     - State: "CA"
     - Rent: "2400"
     - Earliest move-in: Select a date
     - Lease end: Select a later date
     - Bedrooms/Bathrooms: "2 bed / 1 bath"
     - Housing type: "Apartment"
     - Description: "Spacious 2BR in Mission District..."
     - Contact: "yourname@example.com"
   - Check both confirmation boxes
   - Click "Post Listing"
   - Verify redirect to browse page with success message

4. **Test Filters:**
   - Enter city name in city filter → Should filter listings
   - Enter max rent → Should filter by price
   - Select housing type → Should filter by type
   - Change sort dropdown → Should reorder listings

5. **View Listing Details:**
   - Click on any listing card
   - Verify all information displays correctly
   - Click "Copy contact info" → Should show "Copied!" feedback
   - Verify clipboard contains contact info (paste somewhere to test)

6. **Delete Listing:**
   - On listing detail page, click "Delete this listing"
   - Confirm deletion in browser alert
   - Verify redirect to browse page
   - Verify listing is removed from list

7. **Test Validation:**
   - Click "Post an Exit"
   - Try submitting empty form → Should show validation errors
   - Enter move-in date after lease end date → Should show error
   - Enter description over 500 chars → Should show error
   - Try submitting without checking confirmations → Should show error

8. **Test Empty State:**
   - Delete all listings (or clear localStorage in DevTools)
   - Verify "No listings found" message appears
   - Verify "Post an Exit" button appears in empty state

9. **Test Persistence:**
   - Post a listing
   - Refresh the page
   - Verify listing still appears (localStorage persistence)

### Security & Safety Notes

- All text inputs are rendered as plain text (no dangerouslySetInnerHTML)
- Description limited to 500 characters
- Contact info limited to 100 characters
- No XSS risk from user input
- No server-side code execution risk (localStorage only)
- Delete function has browser confirmation prompt
- Disclaimers shown on all pages:
  - "Listings are user-posted and not verified"
  - "This is for information, not legal advice"
  - "Subject to landlord approval"

### Known Limitations (MVP)

- No user authentication or accounts
- No ownership verification for deletions
- No abuse prevention or rate limiting
- No backend persistence or synchronization
- No messaging system between renters
- No landlord verification
- No payment processing
- No listing expiration
- No search across multiple browsers/devices
- Report listing button is UI placeholder only

### Development Notes

**File Structure:**
- `/app/exit-board/page.tsx` → Browse listings page with filters
- `/app/exit-board/new/page.tsx` → Post new listing form
- `/app/exit-board/[id]/page.tsx` → Individual listing detail page
- `/lib/storage.ts` → localStorage helper functions
- `/lib/types.ts` → ExitListing TypeScript type

**Type Definition:**
```typescript
type ExitListing = {
  id: string;
  createdAt: string;
  city: string;
  state: string;
  neighborhood?: string;
  rent: number;
  deposit?: number;
  leaseEndDate: string;
  earliestMoveInDate: string;
  bedsBaths: string;
  housingType: "apartment" | "house" | "townhouse" | "other";
  description: string;
  reason?: string;
  contact: string;
};
```

**Storage Functions:**
- `loadListings()` → Returns all listings
- `saveListings(listings)` → Saves listings array
- `addListing(listing)` → Adds new listing
- `deleteListing(id)` → Removes listing by ID
- `getListing(id)` → Gets single listing


---

## Exit Board with Supabase (Real Database)

The Exit Board feature now uses Supabase for real database storage with user authentication.

### Setup Instructions

1. **Create a Supabase Project:**
   - Go to https://supabase.com and create a new project
   - Wait for the project to be provisioned

2. **Run the SQL Schema:**
   - In your Supabase project, go to SQL Editor
   - Open the file `/supabase_setup.sql` from the project root
   - Copy and paste the entire SQL file into the SQL Editor
   - Click "Run" to execute
   - Verify success message appears

3. **Get API Credentials:**
   - In Supabase, go to Settings > API
   - Copy your "Project URL"
   - Copy your "anon/public" API key

4. **Configure Environment Variables:**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```
   Edit `.env.local` and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

### Features

**Authentication:**
- Email/password sign up at `/auth/sign-up`
- Email/password sign in at `/auth/sign-in`
- Sign out button in navigation when logged in
- Auth state persists across page refreshes

**Browse Listings (Public):**
- Anyone can view active listings without authentication
- Filter by city, max rent, housing type
- Sort by rent, move-in date, lease end date
- Real-time data from Supabase

**Post Listing (Auth Required):**
- Must be logged in to access `/exit-board/new`
- Redirects to sign-in if not authenticated
- All validations still enforced
- Listing stored in Supabase with user_id

**Listing Details:**
- Anyone can view listing details
- Copy-to-clipboard for contact info
- Delete button only visible to listing owner
- Soft delete (sets status='deleted')

### Security

**Row Level Security (RLS):**
- Enabled on exit_listings table
- SELECT: Anyone can read active listings
- INSERT: Only authenticated users, with their own user_id
- UPDATE: Only owners can update their listings
- DELETE: Only owners can delete their listings

**Data Validation:**
- All client-side validations remain
- Database constraints prevent invalid data
- User_id automatically set from session
- Status defaults to 'active'

### Manual Testing Checklist

#### 1. Browse Logged Out
```bash
# Open browser
http://localhost:3000/exit-board

# Expected:
- Can see all active listings
- Can filter and sort
- Can click to view details
- Cannot see "Delete" button on any listing
```

#### 2. Try Posting Logged Out
```bash
# Click "Post an Exit" button

# Expected:
- Redirects to /auth/sign-in?next=/exit-board/new
- Sign in form appears
```

#### 3. Sign Up
```bash
# Navigate to sign up
http://localhost:3000/auth/sign-up

# Fill in form:
- Email: test@example.com
- Password: password123
- Confirm Password: password123

# Expected:
- Account created
- Redirected to /exit-board
- "Sign Out" button appears in nav
```

#### 4. Sign In
```bash
# Sign out first
# Navigate to sign in
http://localhost:3000/auth/sign-in

# Use same credentials:
- Email: test@example.com
- Password: password123

# Expected:
- Successfully signed in
- Redirected to /exit-board
- "Sign Out" button appears in nav
```

#### 5. Post a Listing (Authenticated)
```bash
# Navigate to post form
http://localhost:3000/exit-board/new

# Fill in all required fields:
- City: San Francisco
- State: CA
- Rent: 2400
- Earliest move-in: 2025-02-15
- Lease end: 2025-08-31
- Beds/Baths: 2 bed / 1 bath
- Housing type: Apartment
- Description: "Spacious 2BR in Mission District"
- Contact: test@example.com
- Check both confirmations

# Click "Post Listing"

# Expected:
- "Listing Posted!" success message
- Redirects to listing detail page
- Listing visible with all information
- "Delete this listing" button visible (you are owner)
```

#### 6. View Listing Logged Out
```bash
# Sign out
# Navigate to Exit Board
# Click on your listing

# Expected:
- Can view all listing details
- Can copy contact info
- NO "Delete this listing" button (not owner)
- "Sign In" link in nav
```

#### 7. Delete Listing as Owner
```bash
# Sign back in as test@example.com
# Navigate to your listing detail page
# Click "Delete this listing"
# Confirm deletion

# Expected:
- Browser confirmation alert
- After confirming, redirected to /exit-board
- Listing no longer appears in browse page
- Listing status='deleted' in database (soft delete)
```

#### 8. Test RLS (Advanced)
```bash
# In Supabase SQL Editor, check RLS:
SELECT * FROM exit_listings WHERE status='deleted';

# Should see soft-deleted listings (admin view only)

# Try to access deleted listing by ID:
http://localhost:3000/exit-board/[deleted-id]

# Expected: "Listing not found" (RLS blocks deleted listings)
```

### Troubleshooting

**"Missing Supabase environment variables"**
- Check that `.env.local` exists
- Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
- Restart dev server after changing .env.local

**"Not authenticated" error when posting**
- Clear browser cookies/local storage
- Sign in again
- Check Supabase Auth is enabled

**Listings not appearing**
- Check Supabase SQL Editor: `SELECT * FROM exit_listings WHERE status='active'`
- Verify RLS policies are enabled
- Check browser console for errors

**Delete button not visible**
- Ensure you're signed in as the listing owner
- Check user_id matches in Supabase table

### Database Schema

```sql
Table: public.exit_listings

Columns:
- id                    uuid PRIMARY KEY
- created_at            timestamptz
- user_id               uuid (FK to auth.users)
- city                  text
- state                 text
- neighborhood          text (nullable)
- rent                  integer
- deposit               integer (nullable)
- lease_end_date        date
- earliest_move_in_date date
- beds_baths            text
- housing_type          text (enum)
- description           text
- reason                text (nullable)
- contact               text
- status                text (default 'active')
```

### Development Files

**New Files Created:**
- `supabase_setup.sql` - Database schema and RLS policies
- `src/lib/supabaseClient.ts` - Supabase client instance
- `src/lib/auth.ts` - Auth helper functions
- `src/lib/exitBoardService.ts` - CRUD operations for listings
- `src/components/AuthNav.tsx` - Navigation with auth state
- `src/app/auth/sign-up/page.tsx` - Sign up page
- `src/app/auth/sign-in/page.tsx` - Sign in page
- `.env.example` - Environment variables template

**Modified Files:**
- `src/lib/types.ts` - Updated ExitListing type for Supabase columns
- `src/app/layout.tsx` - Integrated AuthNav component
- `src/app/exit-board/page.tsx` - Fetch from Supabase
- `src/app/exit-board/new/page.tsx` - Auth protection + Supabase insert
- `src/app/exit-board/[id]/page.tsx` - Fetch from Supabase + owner-only delete

**Removed:**
- localStorage operations (replaced with Supabase)

