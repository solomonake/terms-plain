# Termsplain MVP Specification
**Product:** Termsplain (Web, Renter-First)
**Version:** 1.0 MVP
**Last Updated:** 2025-12-30

---

## A. User Flow

### Primary Flow: Analyze Lease
1. **Land on homepage** → See value prop, two CTA buttons: "Analyze My Lease" and "Explain a Clause"
2. **Click "Analyze My Lease"** → Navigate to Lease Input screen
3. **Paste lease text** into textarea → Click "Analyze Lease" button
4. **System processes text** → Show loading state (3–10 seconds)
5. **View Analysis Results** → See red/yellow/green flags organized by category (rent, termination, deposits, repairs, etc.)
6. **Click any flagged clause** → Navigate to Clause Detail screen with plain-English explanation
7. **Return to results** → Click back or click another clause
8. **Optional: Post to Exit Board** → Click "I'm Moving Out" button from results screen → Navigate to Exit Board Post form

### Secondary Flow: Explain This Clause
9. **From homepage, click "Explain a Clause"** → Navigate to Clause Explainer screen
10. **Paste clause text** → Click "Explain This" button
11. **View single-clause explanation** → See plain-English breakdown with red/yellow/green severity indicator

### Tertiary Flow: Exit Board
12. **Access Exit Board** (from nav or results screen) → Browse available listings or post your own unit

---

## B. Screens & Components

### Screen 1: Homepage (`/`)
**Purpose:** Landing page, value prop, entry points

**Components:**
- **Hero Section**
  - Heading: "Understand Your Lease in Plain English"
  - Subheading: "Know your rights before you sign. No legal jargon."
  - Primary CTA Button: "Analyze My Lease"
  - Secondary CTA Button: "Explain a Clause"
- **Feature Cards** (3 cards)
  - Card 1: "Red Flag Detection" (icon + 1 sentence)
  - Card 2: "Plain-English Explanations" (icon + 1 sentence)
  - Card 3: "Exit Board" (icon + 1 sentence)
- **Disclaimer (Footer)**
  - Text: "Termsplain provides informational summaries only and does not constitute legal advice. Consult a licensed attorney for legal matters."
- **Navigation Bar**
  - Logo (left)
  - Links: "Analyze Lease" | "Explain Clause" | "Exit Board"

---

### Screen 2: Lease Input (`/analyze`)
**Purpose:** Accept full lease text for analysis

**Components:**
- **Page Heading:** "Paste Your Lease Text"
- **Subheading:** "Copy and paste your lease agreement below. We'll highlight key clauses and red flags."
- **Textarea Input**
  - Placeholder: "Paste your lease text here..."
  - Min-height: 400px
  - Character counter (optional)
- **Primary Button:** "Analyze Lease" (disabled until text entered)
- **Secondary Link:** "Or explain a single clause instead"
- **Disclaimer (Inline)**
  - Small text below button: "Informational only, not legal advice."
- **Back Link:** "← Back to Home"

---

### Screen 3: Analysis Results (`/results`)
**Purpose:** Display flagged clauses organized by category and severity

**Components:**
- **Page Heading:** "Your Lease Analysis"
- **Summary Card**
  - Red flags count (e.g., "3 red flags")
  - Yellow flags count (e.g., "5 yellow flags")
  - Green/OK count (e.g., "12 clauses reviewed")
- **Category Sections** (collapsible or stacked)
  - Section per category: "Rent & Fees", "Security Deposit", "Termination & Move-Out", "Repairs & Maintenance", "Other"
  - Each section contains:
    - **Clause Cards** (one per flagged clause)
      - Severity badge (red/yellow/green dot or label)
      - Clause snippet (first 60 characters + "...")
      - "See Explanation" button
- **Action Buttons (Bottom)**
  - Primary: "I'm Moving Out" → Navigate to Exit Board Post
  - Secondary: "Analyze Another Lease"
- **Disclaimer (Footer):** Same as homepage
- **Back Link:** "← Back to Input"

---

### Screen 4: Clause Detail (`/results/clause/:id`)
**Purpose:** Show plain-English explanation for one clause

**Components:**
- **Severity Indicator**
  - Badge: "Red Flag" / "Yellow Flag" / "OK"
- **Clause Heading:** "What This Means"
- **Original Clause Text** (in gray box, verbatim from lease)
- **Plain-English Explanation**
  - Paragraph(s): breakdown in simple language
  - Bullet list (if applicable): key takeaways
- **What to Watch For** (if red/yellow)
  - Short list of renter risks
- **Action Buttons**
  - Primary: "Back to Results"
  - Secondary: "Explain Another Clause"
- **Disclaimer (Footer):** Same as homepage

---

### Screen 5: Clause Explainer (`/explain`)
**Purpose:** Single-clause quick explainer (no full lease analysis)

**Components:**
- **Page Heading:** "Explain a Single Clause"
- **Subheading:** "Paste any lease clause below and we'll break it down in plain English."
- **Textarea Input**
  - Placeholder: "Paste the clause here..."
  - Min-height: 200px
- **Primary Button:** "Explain This"
- **Secondary Link:** "Or analyze your full lease"
- **Disclaimer (Inline):** "Informational only, not legal advice."
- **Back Link:** "← Back to Home"

---

### Screen 6: Clause Explanation Result (`/explain/result`)
**Purpose:** Show explanation for pasted clause (standalone)

**Components:**
- **Severity Indicator**
  - Badge: "Red Flag" / "Yellow Flag" / "OK"
- **Original Clause Text** (in gray box)
- **Plain-English Explanation**
  - Paragraph(s)
  - Bullet list (optional)
- **What to Watch For** (if red/yellow)
- **Action Buttons**
  - Primary: "Explain Another Clause"
  - Secondary: "Analyze Full Lease"
- **Disclaimer (Footer):** Same as homepage

---

### Screen 7: Exit Board Listing (`/exit-board`)
**Purpose:** Browse available units from renters moving out

**Components:**
- **Page Heading:** "Exit Board"
- **Subheading:** "Find units from renters who are moving out. No broker fees."
- **Post Button (Top Right):** "Post My Unit"
- **Filter Bar** (optional for MVP)
  - Location dropdown
  - Price range slider
- **Listing Cards Grid**
  - Each card:
    - Unit address (e.g., "123 Main St, Apt 4B")
    - Monthly rent (e.g., "$2,400/mo")
    - Move-out date (e.g., "Available Feb 15")
    - Lease end date (e.g., "Lease ends Mar 1")
    - "Contact Renter" button
- **Empty State** (if no listings)
  - Text: "No listings yet. Be the first to post!"
  - CTA: "Post My Unit"
- **Disclaimer (Footer):** "Termsplain connects renters directly. Verify all information independently."

---

### Screen 8: Exit Board Post Form (`/exit-board/post`)
**Purpose:** Allow renter to list their unit

**Components:**
- **Page Heading:** "Post Your Unit"
- **Form Fields**
  - Unit Address (text input)
  - Monthly Rent (number input, $ prefix)
  - Move-Out Date (date picker)
  - Lease End Date (date picker)
  - Description (textarea, optional, 200 char limit)
  - Contact Email (text input)
- **Checkbox:** "I agree to Termsplain's posting guidelines" (link to guidelines modal)
- **Primary Button:** "Post Listing"
- **Secondary Button:** "Cancel"
- **Disclaimer (Inline):** "You are responsible for the accuracy of your listing. Termsplain is not a broker."
- **Back Link:** "← Back to Exit Board"

---

### Screen 9: Exit Board Listing Detail (`/exit-board/:id`)
**Purpose:** Show full details for one listing

**Components:**
- **Unit Address** (heading)
- **Details Section**
  - Monthly rent
  - Move-out date
  - Lease end date
  - Description (if provided)
- **Contact Button:** "Contact Renter" → Opens email client or shows contact email
- **Back Link:** "← Back to Exit Board"
- **Disclaimer (Footer):** "Verify all information independently. Termsplain is not responsible for listing accuracy."

---

## Engineering Notes

### Required API Endpoints (Backend)
- `POST /api/analyze` → Accept lease text, return analysis JSON (categories, clauses, severity)
- `POST /api/explain` → Accept clause text, return explanation JSON (severity, explanation, warnings)
- `GET /api/exit-board` → Return array of listings
- `POST /api/exit-board` → Create new listing
- `GET /api/exit-board/:id` → Return single listing detail

### Key UI States
- **Loading states:** Show spinner during analysis (3–10s expected)
- **Error states:** "Something went wrong. Try again." with retry button
- **Empty states:** Exit Board with no listings

### Copy Tone
- Friendly, direct, non-condescending
- Avoid legal jargon
- Use "you" and "your"
- Example: "This clause could cost you extra" vs. "This provision may result in additional fees"

### Legal Disclaimer (Standard Footer)
"Termsplain provides informational summaries only and does not constitute legal advice. Consult a licensed attorney for legal matters."

---

## Out of Scope for MVP
- PDF upload (text paste only)
- User accounts / login
- Landlord dashboard
- Payment processing
- Clause comparison across leases
- Mobile app (web-responsive only)
- Advanced filtering/search on Exit Board
- Messaging system (email links only)

---

**This spec is buildable. No ambiguity. Ship it.**
