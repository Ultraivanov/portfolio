export type PastProject = {
  title: string;
  detail: string;
  year: string;
  href?: string;
};

export type PastProjects = {
  label: string;
  items: PastProject[];
};

export const pastProjects: PastProjects = {
  label: "Past projects:",
  items: [
    {
      title: "Megamod",
      detail: "Pitch Deck",
      year: "2024",
    },
    {
      title: "Keep the flow",
      detail: "T-shirt as a digital product",
      year: "2024",
    },
    {
      title: "Megamod",
      detail: "Investors website",
      year: "2024",
    },
    {
      title: "Tel Aviv University • AMC",
      detail: "Logo",
      year: "2023",
    },
    {
      title: "Russian Railway",
      detail: "Product Design",
      year: "2022",
    },
    {
      title: "Russian Railways",
      detail: "Resort booking case",
      year: "2020–2021",
      href: "/work/railway-booking-flow",
    },
    {
      title: "Technion",
      detail: "Pitch Deck for Israel Institute of Metals",
      year: "2020",
    },
    {
      title: "Lukoil",
      detail: "Pitch Deck",
      year: "2019",
    },
  ],
};
