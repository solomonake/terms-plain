"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import { createListing } from "@/lib/exitBoardService";
import { trackEvent } from "@/lib/analytics";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function NewExitPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const listingTrackedRef = useRef(false);

  const [formData, setFormData] = useState({
    city: "",
    state: "",
    neighborhood: "",
    rent: "",
    deposit: "",
    leaseEndDate: "",
    earliestMoveInDate: "",
    bedsBaths: "",
    housingType: "" as "" | "apartment" | "house" | "townhouse" | "other",
    description: "",
    reason: "",
    contact: "",
    confirmTruthful: false,
    confirmNotVerified: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (!hasSupabaseEnv || !supabase) {
      setIsCheckingAuth(false);
      setIsAuthenticated(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth/sign-in?next=/exit-board/new");
      return;
    }
    setIsAuthenticated(true);
    setIsCheckingAuth(false);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state) {
      newErrors.state = "State is required";
    }
    if (
      !formData.rent ||
      isNaN(Number(formData.rent)) ||
      Number(formData.rent) <= 0
    ) {
      newErrors.rent = "Rent must be greater than 0";
    }
    if (!formData.leaseEndDate) {
      newErrors.leaseEndDate = "Lease end date is required";
    }
    if (!formData.earliestMoveInDate) {
      newErrors.earliestMoveInDate = "Earliest move-in date is required";
    }
    if (formData.earliestMoveInDate && formData.leaseEndDate) {
      if (
        new Date(formData.earliestMoveInDate) > new Date(formData.leaseEndDate)
      ) {
        newErrors.earliestMoveInDate =
          "Move-in date must be before lease end date";
      }
    }
    if (!formData.bedsBaths.trim()) {
      newErrors.bedsBaths = "Bedroom/bath info is required";
    }
    if (!formData.housingType) {
      newErrors.housingType = "Housing type is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (formData.description.length > 500) {
      newErrors.description = "Description must be 500 characters or less";
    }
    if (!formData.contact.trim()) {
      newErrors.contact = "Contact info is required";
    }
    if (formData.contact.length > 100) {
      newErrors.contact = "Contact info must be 100 characters or less";
    }
    if (!formData.confirmTruthful) {
      newErrors.confirmTruthful = "You must confirm this listing is truthful";
    }
    if (!formData.confirmNotVerified) {
      newErrors.confirmNotVerified =
        "You must acknowledge Termsplain does not verify listings";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) {
      return;
    }

    const { data, error } = await createListing({
      city: formData.city.trim(),
      state: formData.state,
      neighborhood: formData.neighborhood.trim() || null,
      rent: Number(formData.rent),
      deposit: formData.deposit ? Number(formData.deposit) : null,
      lease_end_date: formData.leaseEndDate,
      earliest_move_in_date: formData.earliestMoveInDate,
      beds_baths: formData.bedsBaths.trim(),
      housing_type: formData.housingType as
        | "apartment"
        | "house"
        | "townhouse"
        | "other",
      description: formData.description.trim(),
      reason: formData.reason.trim() || null,
      contact: formData.contact.trim(),
    });

    if (error) {
      setSubmitError(error.message || "Failed to create listing");
      return;
    }

    if (data) {
      if (!listingTrackedRef.current) {
        listingTrackedRef.current = true;
        void trackEvent({ type: "exit_listing_created" });
      }
      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/exit-board/${data.id}`);
      }, 1500);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="section">
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (showSuccess) {
    return (
      <div className="section">
        <div
          className="card"
          style={{ textAlign: "center", padding: "48px 20px" }}
        >
          <h2>Listing Posted!</h2>
          <p>Redirecting to your listing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>Post an Exit</h2>
      <p>List your lease so someone can take it over.</p>
      <p className="disclaimer">This is for information, not legal advice</p>
      {!hasSupabaseEnv ? (
        <div className="card">
          <p>
            Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.
          </p>
        </div>
      ) : null}

      <form className="form card" onSubmit={handleSubmit}>
        <div className="section">
          <h3>Location</h3>

          <div className="section">
            <label htmlFor="city">City *</label>
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
            />
            {errors.city && <p className="error">{errors.city}</p>}
          </div>

          <div className="section">
            <label htmlFor="state">State *</label>
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
            >
              <option value="">Select state</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {errors.state && <p className="error">{errors.state}</p>}
          </div>

          <div className="section">
            <label htmlFor="neighborhood">Neighborhood (optional)</label>
            <input
              id="neighborhood"
              name="neighborhood"
              type="text"
              value={formData.neighborhood}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="section">
          <h3>Rent & Deposit</h3>

          <div className="section">
            <label htmlFor="rent">Monthly rent ($) *</label>
            <input
              id="rent"
              name="rent"
              type="number"
              min="0"
              step="1"
              value={formData.rent}
              onChange={handleChange}
            />
            {errors.rent && <p className="error">{errors.rent}</p>}
          </div>

          <div className="section">
            <label htmlFor="deposit">Security deposit ($) (optional)</label>
            <input
              id="deposit"
              name="deposit"
              type="number"
              min="0"
              step="1"
              value={formData.deposit}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="section">
          <h3>Dates</h3>

          <div className="section">
            <label htmlFor="earliestMoveInDate">Earliest move-in date *</label>
            <input
              id="earliestMoveInDate"
              name="earliestMoveInDate"
              type="date"
              value={formData.earliestMoveInDate}
              onChange={handleChange}
            />
            {errors.earliestMoveInDate && (
              <p className="error">{errors.earliestMoveInDate}</p>
            )}
          </div>

          <div className="section">
            <label htmlFor="leaseEndDate">Lease end date *</label>
            <input
              id="leaseEndDate"
              name="leaseEndDate"
              type="date"
              value={formData.leaseEndDate}
              onChange={handleChange}
            />
            {errors.leaseEndDate && (
              <p className="error">{errors.leaseEndDate}</p>
            )}
          </div>
        </div>

        <div className="section">
          <h3>Unit Details</h3>

          <div className="section">
            <label htmlFor="bedsBaths">
              Bedrooms/Bathrooms * (e.g. "1 bed / 1 bath")
            </label>
            <input
              id="bedsBaths"
              name="bedsBaths"
              type="text"
              placeholder="e.g. 2 bed / 1.5 bath"
              value={formData.bedsBaths}
              onChange={handleChange}
            />
            {errors.bedsBaths && <p className="error">{errors.bedsBaths}</p>}
          </div>

          <div className="section">
            <label htmlFor="housingType">Housing type *</label>
            <select
              id="housingType"
              name="housingType"
              value={formData.housingType}
              onChange={handleChange}
            >
              <option value="">Select type</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="townhouse">Townhouse</option>
              <option value="other">Other</option>
            </select>
            {errors.housingType && (
              <p className="error">{errors.housingType}</p>
            )}
          </div>
        </div>

        <div className="section">
          <h3>Description</h3>

          <div className="section">
            <label htmlFor="description">
              Description * (max 500 characters)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your unit, neighborhood, amenities, etc."
              maxLength={500}
            />
            <p className="muted">{formData.description.length}/500 characters</p>
            {errors.description && (
              <p className="error">{errors.description}</p>
            )}
          </div>

          <div className="section">
            <label htmlFor="reason">Reason for leaving (optional)</label>
            <input
              id="reason"
              name="reason"
              type="text"
              value={formData.reason}
              onChange={handleChange}
              placeholder="e.g. Job relocation"
            />
          </div>
        </div>

        <div className="section">
          <h3>Contact</h3>

          <div className="section">
            <label htmlFor="contact">
              Contact info * (email or preferred contact, max 100 characters)
            </label>
            <input
              id="contact"
              name="contact"
              type="text"
              value={formData.contact}
              onChange={handleChange}
              placeholder="your.email@example.com"
              maxLength={100}
            />
            {errors.contact && <p className="error">{errors.contact}</p>}
          </div>
        </div>

        <div className="section">
          <h3>Confirmations</h3>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <input
              id="confirmTruthful"
              name="confirmTruthful"
              type="checkbox"
              checked={formData.confirmTruthful}
              onChange={handleChange}
            />
            <label htmlFor="confirmTruthful" style={{ fontWeight: "normal" }}>
              I confirm this listing is truthful
            </label>
          </div>
          {errors.confirmTruthful && (
            <p className="error">{errors.confirmTruthful}</p>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <input
              id="confirmNotVerified"
              name="confirmNotVerified"
              type="checkbox"
              checked={formData.confirmNotVerified}
              onChange={handleChange}
            />
            <label
              htmlFor="confirmNotVerified"
              style={{ fontWeight: "normal" }}
            >
              I understand Termsplain does not verify listings
            </label>
          </div>
          {errors.confirmNotVerified && (
            <p className="error">{errors.confirmNotVerified}</p>
          )}
        </div>

        <div className="section">
          <p className="disclaimer">
            Listings are user-posted and not verified. Informational only, not
            legal advice.
          </p>
        </div>

        {submitError && (
          <div className="section">
            <p className="error">{submitError}</p>
          </div>
        )}

        <div className="cta-row">
          <button
            type="submit"
            className="button"
            disabled={!hasSupabaseEnv}
          >
            Post Listing
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => router.push("/exit-board")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
