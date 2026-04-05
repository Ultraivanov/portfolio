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
  subtitle?: string;
  imageSrc?: string;
  imageAlt?: string;
  href?: string;
};

export type PastProjects = {
  label: string;
  maxItems?: number | null;
  featuredCases?: string[];
  items: PastProject[];
};

export type ResourceItem = {
  title: string;
  description: string;
  linkLabel: string;
  href: string;
};

export type Resources = {
  label: string;
  items: ResourceItem[];
};

export type FooterLink = {
  label: string;
  href: string;
  muted?: boolean;
};

export type CallToAction = {
  titleLine1: string;
  titleLine2: string;
  highlight: string;
  description: string;
  links: FooterLink[];
};

export type HomeContent = {
  hero: Hero;
  about: About;
  cover: Cover;
  skills: SkillSection;
  tools: ToolSection;
  pastProjects: PastProjects;
  resources: Resources;
  cta: CallToAction;
};

export const home = homeData as HomeContent;
