import homeData from "./home.json";

export type Hero = {
  title: string;
  role: string;
  headline: string;
  subhead: string;
  primaryCTA: string;
  secondaryCTA: string;
};

export type Intro = {
  name: string;
  role: string;
  avatarSrc: string;
  highlights: string[];
};

export type ValueItem = {
  title: string;
  description: string;
};

export type HomeContent = {
  hero: Hero;
  intro: Intro;
  valueProps: ValueItem[];
};

export const home = homeData as HomeContent;
