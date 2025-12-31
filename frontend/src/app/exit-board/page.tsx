"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ExitListing } from "@/lib/types";
import { fetchActiveListings } from "@/lib/exitBoardService";
import { fetchAppStats } from "@/lib/analytics";

type SortOption = "rent-low" | "rent-high" | "move-in" | "lease-end";

export default function ExitBoardPage() {
  const [listings, setListings] = useState<ExitListing[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [housingFilter, setHousingFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("move-in");
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    leasesAnalyzed: 0,
    listingsCreated: 0,
    listingsViewed: 0,
  });

  useEffect(() => {
    loadListings();
    loadStats();
  }, []);

  const loadListings = async () => {
    setIsLoading(true);
    const data = await fetchActiveListings();
    setListings(data);
    setIsLoading(false);
  };

  const loadStats = async () => {
    setStatsLoading(true);
    const data = await fetchAppStats();
    setStats(data);
    setStatsLoading(false);
  };

  const filteredAndSortedListings = useMemo(() => {
    let filtered = listings;

    if (cityFilter.trim()) {
      const query = cityFilter.trim().toLowerCase();
      filtered = filtered.filter((listing) =>
        listing.city.toLowerCase().includes(query)
      );
    }

    if (maxRent && !isNaN(Number(maxRent))) {
      const max = Number(maxRent);
      filtered = filtered.filter((listing) => listing.rent <= max);
    }

    if (housingFilter) {
      filtered = filtered.filter(
        (listing) => listing.housing_type === housingFilter
      );
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case "rent-low":
        sorted.sort((a, b) => a.rent - b.rent);
        break;
      case "rent-high":
        sorted.sort((a, b) => b.rent - a.rent);
        break;
      case "move-in":
        sorted.sort(
          (a, b) =>
            new Date(a.earliest_move_in_date).getTime() -
            new Date(b.earliest_move_in_date).getTime()
        );
        break;
      case "lease-end":
        sorted.sort(
          (a, b) =>
            new Date(a.lease_end_date).getTime() -
            new Date(b.lease_end_date).getTime()
        );
        break;
    }

    return sorted;
  }, [listings, cityFilter, maxRent, housingFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="section">
        <h2>Exit Board</h2>
        <p>Loading listings...</p>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>Exit Board</h2>
      <p>Find lease takeovers from renters who are moving out.</p>
      <p className="disclaimer">
        Listings are user-posted and not verified. Subject to landlord approval.
      </p>

      <div className="cta-row" style={{ marginTop: "16px" }}>
        <Link href="/exit-board/new" className="button">
          Post an Exit
        </Link>
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <div className="section">
          <h3>Live activity</h3>
          {statsLoading ? (
            <p>Loading stats...</p>
          ) : (
            <div className="section">
              <p>Leases analyzed: {stats.leasesAnalyzed}</p>
              <p>Listings posted: {stats.listingsCreated}</p>
              <p>Listing views: {stats.listingsViewed}</p>
            </div>
          )}
          <p className="muted">
            Counts update automatically. No personal data is stored.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <div className="section">
          <h3>Filters</h3>
          <div className="form">
            <div className="section">
              <label htmlFor="city-filter">City</label>
              <input
                id="city-filter"
                type="text"
                placeholder="Search by city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
            <div className="section">
              <label htmlFor="max-rent">Max rent</label>
              <input
                id="max-rent"
                type="number"
                placeholder="e.g. 2000"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
              />
            </div>
            <div className="section">
              <label htmlFor="housing-type">Housing type</label>
              <select
                id="housing-type"
                value={housingFilter}
                onChange={(e) => setHousingFilter(e.target.value)}
              >
                <option value="">All types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="townhouse">Townhouse</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="section">
              <label htmlFor="sort-by">Sort by</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="move-in">Earliest move-in</option>
                <option value="lease-end">Soonest lease end</option>
                <option value="rent-low">Rent: Low to High</option>
                <option value="rent-high">Rent: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="section" style={{ marginTop: "24px" }}>
        <h3>Listings ({filteredAndSortedListings.length})</h3>
        {filteredAndSortedListings.length === 0 ? (
          <div className="card">
            <strong>No listings found</strong>
            {listings.length === 0 ? (
              <>
                <p>Be the first to post.</p>
                <Link
                  href="/exit-board/new"
                  className="button"
                  style={{ marginTop: "12px" }}
                >
                  Post an Exit
                </Link>
              </>
            ) : (
              <p>Try adjusting your filters.</p>
            )}
          </div>
        ) : (
          <div className="listing-grid">
            {filteredAndSortedListings.map((listing) => (
              <Link
                href={`/exit-board/${listing.id}`}
                key={listing.id}
                className="listing-card"
              >
                <strong>
                  {listing.city}, {listing.state}
                </strong>
                <div className="listing-meta">
                  <span>${listing.rent}/mo</span>
                  <span>{listing.beds_baths}</span>
                  <span className="cap">{listing.housing_type}</span>
                </div>
                <div className="listing-meta">
                  <span>
                    Move-in:{" "}
                    {new Date(listing.earliest_move_in_date).toLocaleDateString()}
                  </span>
                  <span>
                    Lease ends:{" "}
                    {new Date(listing.lease_end_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="truncate">{listing.description}</p>
                <p className="muted">
                  Posted {new Date(listing.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
