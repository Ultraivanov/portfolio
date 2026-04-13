export interface Fact {
  label: string;
  value: string | string[];
}

export interface Block {
  discriminant: "paragraph" | "list" | "link" | "media";
  value: {
    text?: string;
    items?: string[];
    label?: string;
    href?: string;
    src?: string;
    alt?: string;
    caption?: string;
    variant?: "phone" | "desktop" | "diagram";
  };
}

export interface Section {
  title: string;
  blocks: Block[];
}

export interface SeoData {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  coverSrc: string;
  coverAlt: string;
  facts: Fact[];
  sections: Section[];
  seo?: SeoData;
}

export interface CaseInfo {
  slug: string;
  title: string;
}
