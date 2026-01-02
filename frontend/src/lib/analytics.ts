import { supabase } from "./supabaseClient";

export type EventType =
  | "lease_analyzed"
  | "clause_explained"
  | "question_asked"
  | "exit_listing_created"
  | "exit_listing_viewed";

const SESSION_KEY = "termsplain_session_id";

export const getSessionId = (): string => {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(SESSION_KEY, randomId);
  return randomId;
};

export const trackEvent = async (args: {
  type: EventType;
  listingId?: string;
}) => {
  try {
    if (!supabase) {
      return;
    }
    const sessionId = getSessionId();
    const { error } = await supabase.from("app_events").insert({
      event_type: args.type,
      listing_id: args.listingId ?? null,
      session_id: sessionId,
    });

    if (error) {
      console.warn("Analytics insert failed:", error.message);
    }
  } catch (error) {
    console.warn("Analytics insert failed:", error);
  }
};

export const fetchAppStats = async () => {
  try {
    if (!supabase) {
      return {
        leasesAnalyzed: 0,
        listingsCreated: 0,
        listingsViewed: 0,
      };
    }
    const { data, error } = await supabase.rpc("get_app_stats");
    if (error || !data) {
      return {
        leasesAnalyzed: 0,
        listingsCreated: 0,
        listingsViewed: 0,
      };
    }

    const stats = Array.isArray(data) ? data[0] : data;

    return {
      leasesAnalyzed: Number(stats?.leases_analyzed ?? 0),
      listingsCreated: Number(stats?.listings_created ?? 0),
      listingsViewed: Number(stats?.listings_viewed ?? 0),
    };
  } catch (error) {
    console.warn("Analytics stats failed:", error);
    return {
      leasesAnalyzed: 0,
      listingsCreated: 0,
      listingsViewed: 0,
    };
  }
};
