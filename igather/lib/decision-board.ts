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
