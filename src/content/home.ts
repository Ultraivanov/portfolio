import homeData from "./home.json";

export type Hero = {
  titleImageSrc: string;
  titleImageAlt: string;
  headline: string;
  ctaLabel: string;
  ctaHref: string;
};

export type About = {
  name: string;
  role: string;
  avatarSrc: string;
  description: string;
};

export type SkillGroup = {
  title: string;
  items: string[];
};

export type SkillSection = {
  label: string;
  groups: SkillGroup[];
};

export type ToolGroup = {
  items: string[];
};

export type ToolSection = {
  label: string;
  groups: ToolGroup[];
};

export type Cover = {
  src: string;
  alt: string;
};

export type PastProject = {
  title: string;
  detail: string;
  year: string;
  href?: string;
  caseSlug?: string;
};

export type PastProjects = {
  label: string;
  items: PastProject[];
};

export type HomeContent = {
  hero: Hero;
  about: About;
  cover: Cover;
  skills: SkillSection;
  tools: ToolSection;
  pastProjects: PastProjects;
};

export const home = homeData as HomeContent;
