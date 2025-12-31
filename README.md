# Termsplain

**Understand your lease before it costs you — and leave early if you need to.**

Termsplain is a consumer-first app that explains leases and contracts in plain English, highlights potentially costly or restrictive clauses, and helps people make informed decisions before they get stuck in agreements they don’t fully understand.

Most lease tools are built for landlords, enterprises, or legal teams. Termsplain is built for everyday people.

---

## 🎯 The Problem

Most people sign leases without fully understanding:
- Hidden or unusual fees
- Early termination penalties
- Automatic renewals
- Subleasing restrictions
- Fine print that only matters when it’s too late

Breaking a lease can cost thousands, and existing tools are either too complex, too expensive, or designed for businesses — not individuals.

---

## 💡 The Solution

Termsplain helps users:
- Upload a lease or contract
- Receive a **plain-English explanation** of what it actually says
- See **risk flags** for clauses that may be costly or restrictive
- Ask questions like “What does this mean?” or “What happens if I leave early?”
- Find a potential way out by listing a lease for takeover if needed

The goal is clarity, not legal advice.

---

## 🧠 How It Works (High Level)

Termsplain uses a hybrid approach:

### 1. Text Extraction (Deterministic)
- Convert lease PDFs to text
- Split documents into logical sections (rent, fees, termination, renewal)
- Detect obvious patterns using rules and keyword matching

### 2. Analysis & Explanation (AI-assisted)
- Use Gemini to:
  - Explain clauses in plain English
  - Answer user questions based only on provided text
  - Highlight commonly risky patterns using cautious language

Gemini is used as an **explanation and reasoning layer**, not a legal authority.

### 3. User Interface
- Highlight text → “Explain this”
- Simple summaries instead of dashboards
- Optional lease exit board to connect users

---

## 🚧 MVP Scope (Strict)

The first version of Termsplain will:

- Explain lease clauses in plain English  
- Flag common risk patterns (informational only)  
- Allow users to highlight clauses and ask questions  
- Provide a simple lease exit board (connection only)

### Explicitly out of scope for MVP:
- Legal advice or legal determinations
- Declaring clauses illegal or unenforceable
- Automated lease transfers
- Landlord or property-management tools
- Enterprise dashboards or portfolio views

If a feature helps landlords more than tenants, it does not ship.

---

## ⚖️ Legal & Safety Boundaries

Termsplain does **not** provide legal advice.

All explanations:
- Use non-authoritative language (“may”, “often”, “commonly”)
- Are based only on the provided lease text
- Clearly state when something is not specified

Lease transfers are subject to landlord approval and existing lease terms.  
Termsplain only connects users and does not execute or approve transfers.

---

## 🗂️ Project Structure

termsplain/
├── frontend/ # Web app (initial focus)
├── backend/ # API, text processing, AI calls
├── mobile/ # Mobile app (later)
├── docs/ # Notes, prompts, planning
└── README.md

---

## 🛠️ Tech Stack (Planned)

- Frontend: React / Next.js
- Backend: Node.js or Python
- AI: Gemini (analysis + explanations), hybrid with rules
- Deployment: TBD

---

## 🚀 Status

Early development / MVP build.

---

## 🌐 Domain

https://termsplain.com
