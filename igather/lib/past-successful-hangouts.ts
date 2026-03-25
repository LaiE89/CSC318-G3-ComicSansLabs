/** Same four venues as “Past Successful Hangout Locations” in group chat + settings list. */

export type PastSuccessfulHangout = {
  id: string;
  name: string;
  date: string;
  tag: string;
  people: number;
  image: string;
};

export const PAST_SUCCESSFUL_HANGOUTS: readonly PastSuccessfulHangout[] = [
  {
    id: "koh",
    name: "Koh Lipe Thai",
    date: "Nov 8, 2025",
    tag: "Restaurant",
    people: 5,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80",
  },
  {
    id: "rec",
    name: "The REC Room",
    date: "Oct 21, 2025",
    tag: "Casual Catchup",
    people: 5,
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&q=80",
  },
  {
    id: "rob",
    name: "Robarts Library",
    date: "Sep 15, 2025",
    tag: "Study Hangout",
    people: 4,
    image:
      "https://images.unsplash.com/photo-1568667256549-088345a05cf4?w=200&q=80",
  },
  {
    id: "bar",
    name: "Bar+Karaoke",
    date: "Aug 3, 2025",
    tag: "Karaoke Night",
    people: 6,
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80",
  },
];

/** Radio list in chat — id + name only */
export const PAST_LOCATIONS = PAST_SUCCESSFUL_HANGOUTS.map(({ id, name }) => ({
  id,
  name,
}));
