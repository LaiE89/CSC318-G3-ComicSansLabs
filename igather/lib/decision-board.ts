import { PAST_SUCCESSFUL_HANGOUTS } from "@/lib/past-successful-hangouts";
import {
  ALL_PROPOSALS_BOARD,
  type ProposalBoardItem,
} from "@/lib/proposals-board-data";

/** Proposals that map to canonical decision-board venues */
const PROPOSAL_TO_VENUE_ID: Record<string, string> = {
  "1": "koh",
  "2": "fox",
  "4": "dear",
};

export type DecisionVenue = {
  id: string;
  name: string;
  priceLabel: string;
  location: string;
  timeLabel: string;
  proposer: string;
  organizer: string;
  image: string;
};

export const DECISION_VENUES: readonly DecisionVenue[] = [
  {
    id: "koh",
    name: "Koh Lipe Thai",
    priceLabel: "$20 per person",
    location: "35 Baldwin St, Toronto, ON",
    timeLabel: "7:30 PM",
    proposer: "Cristiano",
    organizer: "Ethan",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  },
  {
    id: "fox",
    name: "Fox on John",
    priceLabel: "$20 per person",
    location: "106 John St #3, Toronto, ON",
    timeLabel: "7:30 PM",
    proposer: "Ethan",
    organizer: "Ethan",
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80",
  },
  {
    id: "dear",
    name: "Dear Saigon",
    priceLabel: "$10–$20 per person",
    location: "185 College St, Toronto, ON",
    timeLabel: "6:30 PM",
    proposer: "Sam",
    organizer: "Ethan",
    image:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80",
  },
] as const;

export function getVenueById(id: string): DecisionVenue | undefined {
  return DECISION_VENUES.find((v) => v.id === id);
}

export function decisionVenueFromProposalItem(
  p: ProposalBoardItem,
  profileName: string,
): DecisionVenue {
  const name = p.title.includes("(")
    ? p.title.slice(0, p.title.indexOf("(")).trim()
    : p.title;
  const loc = p.location.replace(/^Location:\s*/i, "").trim();
  const priceLine = p.price.replace(/^Price Per Person:\s*/i, "").trim();
  return {
    id: `proposal-${p.id}`,
    name,
    priceLabel: priceLine || p.price,
    location: loc,
    timeLabel: "From proposals",
    proposer: profileName,
    organizer: profileName,
    image: p.image,
  };
}

export function getBoardVenueForProposalItem(
  item: ProposalBoardItem,
  profileName: string,
): DecisionVenue {
  const canonicalId = PROPOSAL_TO_VENUE_ID[item.id];
  if (canonicalId) {
    const v = getVenueById(canonicalId);
    if (v) {
      return { ...v, organizer: profileName, proposer: profileName };
    }
  }
  return decisionVenueFromProposalItem(item, profileName);
}

export type BoardRowInit = {
  venue: DecisionVenue;
  votes: number;
  max: number;
};

export function boardRowsFromActiveProposalIds(
  ids: string[],
  profileName: string,
): BoardRowInit[] {
  const rows: BoardRowInit[] = [];
  const seenProposalIds = new Set<string>();
  const seenVenueIds = new Set<string>();
  for (const id of ids) {
    if (seenProposalIds.has(id)) continue;
    seenProposalIds.add(id);
    const item = ALL_PROPOSALS_BOARD.find((p) => p.id === id);
    if (!item) continue;
    const venue = getBoardVenueForProposalItem(item, profileName);
    if (seenVenueIds.has(venue.id)) continue;
    seenVenueIds.add(venue.id);
    rows.push({
      venue,
      votes: 0,
      max: 5,
    });
  }
  return rows;
}

/** Map a “successful hangout” id (or existing decision id) to a board card. */
export function getDecisionVenueFromPlanSeed(
  id: string,
  profileName: string,
): DecisionVenue {
  const trimmed = id.trim();
  const existing = getVenueById(trimmed);
  if (existing) {
    return { ...existing, organizer: profileName, proposer: profileName };
  }
  const past = PAST_SUCCESSFUL_HANGOUTS.find((p) => p.id === trimmed);
  if (past) {
    return {
      id: past.id,
      name: past.name,
      priceLabel: "Past successful hangout",
      location: "Toronto area",
      timeLabel: past.date,
      proposer: profileName,
      organizer: profileName,
      image: past.image.includes("w=")
        ? past.image.replace(/w=\d+/, "w=800")
        : past.image,
    };
  }
  const fallback = DECISION_VENUES[0];
  return {
    ...fallback,
    organizer: profileName,
    proposer: profileName,
  };
}

/** Venue detail: canonical id, proposal-* id from proposals flow, or past-hangout id. */
export function getVenueForBoardDetail(
  id: string,
  profileName: string,
): DecisionVenue {
  const canonical = getVenueById(id);
  if (canonical) {
    return { ...canonical, organizer: profileName, proposer: profileName };
  }
  const m = /^proposal-(.+)$/.exec(id);
  if (m) {
    const item = ALL_PROPOSALS_BOARD.find((p) => p.id === m[1]);
    if (item) return getBoardVenueForProposalItem(item, profileName);
  }
  return getDecisionVenueFromPlanSeed(id, profileName);
}
