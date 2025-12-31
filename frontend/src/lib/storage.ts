import type { ExitListing } from "./types";

const STORAGE_KEY = "termsplain_exit_listings_v1";

export const loadListings = (): ExitListing[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ExitListing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

export const saveListings = (listings: ExitListing[]): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  } catch {
    console.error("Failed to save listings to localStorage");
  }
};

export const addListing = (listing: ExitListing): ExitListing[] => {
  const existing = loadListings();
  const next = [listing, ...existing];
  saveListings(next);
  return next;
};

export const deleteListing = (id: string): ExitListing[] => {
  const existing = loadListings();
  const next = existing.filter((listing) => listing.id !== id);
  saveListings(next);
  return next;
};

export const getListing = (id: string): ExitListing | null => {
  const listings = loadListings();
  return listings.find((listing) => listing.id === id) || null;
};
