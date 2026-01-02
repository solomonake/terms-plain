"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  fetchListingById,
  softDeleteListing,
  checkIsOwner,
} from "@/lib/exitBoardService";
import type { ExitListing } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { hasSupabaseEnv } from "@/lib/supabaseClient";

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [listing, setListing] = useState<ExitListing | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    loadListing(id);
  }, [id]);

  const loadListing = async (listingId: string) => {
    const result = await fetchListingById(listingId);
    if (result) {
      setListing(result);
      const ownerCheck = await checkIsOwner(listingId);
      setIsOwner(ownerCheck);
      if (!viewTrackedRef.current) {
        viewTrackedRef.current = true;
        void trackEvent({ type: "exit_listing_viewed", listingId });
      }
    } else {
      setNotFound(true);
    }
  };

  const handleCopyContact = () => {
    if (listing) {
      navigator.clipboard.writeText(listing.contact);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing? This cannot be undone."
    );
    if (confirmed && listing) {
      setIsDeleting(true);
      const { error } = await softDeleteListing(listing.id);
      if (error) {
        alert("Failed to delete listing: " + error.message);
        setIsDeleting(false);
      } else {
        router.push("/exit-board");
      }
    }
  };

  if (!id) {
    return (
      <div className="section">
        <p>Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="section">
        <div className="card">
          <h2>Listing not found</h2>
          <p>This listing may have been removed.</p>
          <Link href="/exit-board" className="button" style={{ marginTop: "16px" }}>
            Back to Exit Board
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="section">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="section">
      <Link href="/exit-board" className="inline-link">
        ← Back to listings
      </Link>
      {!hasSupabaseEnv ? (
        <div className="card" style={{ marginTop: "16px" }}>
          <p>
            Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.
          </p>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: "16px" }}>
        <div className="section">
          <h2>
            {listing.city}, {listing.state}
          </h2>
          {listing.neighborhood && (
            <p className="flag-meta">Neighborhood: {listing.neighborhood}</p>
          )}
          <p className="muted">
            Posted {new Date(listing.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="section">
          <h3>Rent & Deposit</h3>
          <p>
            <strong>${listing.rent}</strong> per month
          </p>
          {listing.deposit && <p>Security deposit: ${listing.deposit}</p>}
        </div>

        <div className="section">
          <h3>Dates</h3>
          <p>
            <strong>Earliest move-in:</strong>{" "}
            {new Date(listing.earliest_move_in_date).toLocaleDateString()}
          </p>
          <p>
            <strong>Lease ends:</strong>{" "}
            {new Date(listing.lease_end_date).toLocaleDateString()}
          </p>
        </div>

        <div className="section">
          <h3>Unit Details</h3>
          <p>
            <strong>Bedrooms/Bathrooms:</strong> {listing.beds_baths}
          </p>
          <p className="cap">
            <strong>Housing type:</strong> {listing.housing_type}
          </p>
        </div>

        <div className="section">
          <h3>Description</h3>
          <p>{listing.description}</p>
        </div>

        {listing.reason && (
          <div className="section">
            <h3>Reason for leaving</h3>
            <p>{listing.reason}</p>
          </div>
        )}

        <div className="section">
          <h3>Contact</h3>
          <p className="flag-meta">{listing.contact}</p>
          <button
            className="button"
            onClick={handleCopyContact}
            style={{ marginTop: "8px" }}
          >
            {copySuccess ? "Copied!" : "Copy contact info"}
          </button>
        </div>

        <div className="section">
          <p className="disclaimer">
            User-posted, not verified. Informational only, not legal advice.
          </p>
        </div>

        {isOwner && (
          <div className="section">
            <button
              className="button-secondary"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ marginTop: "12px" }}
            >
              {isDeleting ? "Deleting..." : "Delete this listing"}
            </button>
            <p className="muted" style={{ marginTop: "8px" }}>
              Only you can see this button because you own this listing.
            </p>
          </div>
        )}

        <div className="section">
          <a href="#" className="inline-link muted">
            Report listing
          </a>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            (Reporting functionality coming soon)
          </p>
        </div>
      </div>
    </div>
  );
}
