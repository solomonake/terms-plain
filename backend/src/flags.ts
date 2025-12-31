export type FlagSeverity = "red" | "yellow" | "green";

export interface FlagDef {
  id: string;
  label: string;
  severity: FlagSeverity;
  keywords: string[];
  regex?: string;
  whyItMatters: string;
}

export const FLAG_DEFS: FlagDef[] = [
  {
    "id": "early-termination-penalty",
    "label": "Early termination penalty",
    "severity": "red",
    "keywords": [
      "early termination fee",
      "terminate early",
      "break the lease",
      "two months rent",
      "three months rent",
      "liquidated damages for early",
      "penalty for breaking",
      "fee equal to",
      "remaining rent due"
    ],
    "regex": "(early termination|break(?:ing)? (?:the )?lease|terminate before).{0,100}(fee|penalty|charge|pay|damages)",
    "whyItMatters": "Leaving before your lease ends may result in significant financial penalties, often equal to multiple months of rent."
  },
  {
    "id": "automatic-renewal",
    "label": "Automatic renewal clause",
    "severity": "yellow",
    "keywords": [
      "automatically renew",
      "auto-renew",
      "renews automatically",
      "automatic extension",
      "unless written notice",
      "continue on a month-to-month",
      "extend for an additional term"
    ],
    "regex": "(automat[ic]+ally? renew|auto[\\s-]?renew|renews? for an additional)",
    "whyItMatters": "Missing the notice deadline may lock you into another full lease term, which commonly requires advance planning."
  },
  {
    "id": "notice-period-requirement",
    "label": "Notice period requirement",
    "severity": "yellow",
    "keywords": [
      "60 days notice",
      "90 days notice",
      "written notice",
      "notice prior to",
      "advance written notice",
      "days before the end",
      "notice to vacate"
    ],
    "regex": "(\\d{2,3})\\s*days?\\s*(notice|prior|before|advance)",
    "whyItMatters": "Notice requirements of 60-90 days are common and missing the deadline may trigger automatic renewal or penalties."
  },
  {
    "id": "sublease-restriction",
    "label": "Subleasing restrictions",
    "severity": "yellow",
    "keywords": [
      "sublease",
      "sublet",
      "assign the lease",
      "not permitted to sublease",
      "written consent required",
      "landlord approval",
      "no assignment or subletting"
    ],
    "regex": "(sublease|sublet|assign).{0,50}(prohibit|not permit|consent|approval|forbidden)",
    "whyItMatters": "Many leases restrict or prohibit subleasing without landlord approval, which may limit your flexibility if you need to move."
  },
  {
    "id": "late-fee-charges",
    "label": "Late fee charges",
    "severity": "red",
    "keywords": [
      "late fee",
      "late charge",
      "after the due date",
      "grace period",
      "additional charge",
      "per day late",
      "percentage of rent"
    ],
    "regex": "(late fee|late charge).{0,80}(\\$\\d+|\\d+%|percent)",
    "whyItMatters": "Late fees can accumulate quickly and commonly range from fixed amounts to percentages of monthly rent."
  },
  {
    "id": "repair-responsibility",
    "label": "Repair responsibility threshold",
    "severity": "green",
    "keywords": [
      "repairs under",
      "tenant responsible for repairs",
      "minor repairs",
      "maintenance under",
      "less than $",
      "small repairs",
      "landlord covers major"
    ],
    "regex": "(repair|maintenance).{0,50}(under|less than|below).{0,30}\\$\\d+",
    "whyItMatters": "Tenants are often responsible for small repairs below a dollar threshold, which is standard practice in most residential leases."
  },
  {
    "id": "security-deposit-deductions",
    "label": "Security deposit deductions",
    "severity": "yellow",
    "keywords": [
      "security deposit",
      "deducted from deposit",
      "damages beyond normal wear",
      "cleaning fees",
      "unpaid rent",
      "return of deposit",
      "withhold from deposit"
    ],
    "regex": "(security deposit|deposit).{0,100}(deduct|withhold|retain|charge)",
    "whyItMatters": "Landlords may deduct from your security deposit for damages, unpaid rent, or cleaning, though normal wear and tear is typically excluded."
  },
  {
    "id": "landlord-entry-rights",
    "label": "Landlord entry rights",
    "severity": "yellow",
    "keywords": [
      "right to enter",
      "access to premises",
      "reasonable notice",
      "24 hours notice",
      "inspect the property",
      "emergency access",
      "enter without notice"
    ],
    "regex": "(enter|access).{0,50}(premises|unit|property).{0,50}(notice|hours|emergency)",
    "whyItMatters": "Landlords commonly have the right to enter with reasonable notice, though emergency situations may allow immediate access."
  },
  {
    "id": "rent-increase-terms",
    "label": "Rent increase terms",
    "severity": "red",
    "keywords": [
      "rent increase",
      "increase the rent",
      "raise the rent",
      "upon renewal",
      "notice of increase",
      "adjust the rent",
      "escalation clause"
    ],
    "regex": "(rent|monthly payment).{0,50}(increase|raise|adjust|escalat)",
    "whyItMatters": "Rent increases upon renewal are common and may significantly affect your housing costs, often requiring advance notice."
  },
  {
    "id": "collections-liquidated-damages",
    "label": "Collections or liquidated damages",
    "severity": "red",
    "keywords": [
      "liquidated damages",
      "collection agency",
      "attorney fees",
      "legal fees",
      "costs of collection",
      "recover all costs",
      "reasonable attorney fees"
    ],
    "regex": "(liquidated damages|collection|attorney.{0,20}fees|legal.{0,20}fees)",
    "whyItMatters": "Lease violations may result in collections actions or liquidated damages, which often include legal fees and collection costs."
  }
];
