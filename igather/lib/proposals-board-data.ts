/** Shared list for Proposals screen and Decision Board filtering */

export type ProposalBoardItem = {
  id: string;
  rank: string;
  title: string;
  price: string;
  location: string;
  image: string;
};

export const ALL_PROPOSALS_BOARD: readonly ProposalBoardItem[] = [
  {
    id: "1",
    rank: "1",
    title: "Koh Lipe Thai (4/5 Votes)",
    price: "Price Per Person: $20-$30",
    location: "Location: 35 Baldwin St, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  },
  {
    id: "2",
    rank: "2",
    title: "Fox on John (4/5 Votes)",
    price: "Price Per Person: $20-$30",
    location: "Location: 106 John St #3, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80",
  },
  {
    id: "3",
    rank: "3",
    title: "4Ever Sushi (3/5 Votes)",
    price: "Price Per Person: $25-$35",
    location: "Location: 225 Queen St W, Toronto, ON M5V 1Z4",
    image:
      "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80",
  },
  {
    id: "4",
    rank: "4",
    title: "Dear Saigon (3/5 Votes)",
    price: "Price Per Person: $10-$20",
    location: "Location: 185 College St, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80",
  },
  {
    id: "5",
    rank: "5",
    title: "Pasta Paradise (2/5 Votes)",
    price: "Price Per Person: $18-$28",
    location: "Location: 220 Queen St W, Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
  },
] as const;
