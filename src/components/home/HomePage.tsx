"use client";

import Image from "next/image";
import { useRef, useEffect } from "react";
import { Button } from "@gravity-ui/uikit";
import { trackEvent } from "@/lib/analytics";
import type { HomeContent } from "@/content/home";
import styles from "./home-page.module.css";

type FeaturedCase = {
  slug: string;
  title: string;
  subtitle: string;
  coverSrc: string;
  coverAlt: string;
};

type HomePageProps = {
  data: HomeContent;
  featuredCases?: FeaturedCase[];
};

export default function HomePage({ data, featuredCases }: HomePageProps) {
  const heroTitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const title = heroTitleRef.current;
    if (!title) return;

    const fit = () => {
      const container = title.parentElement;
      if (!container) return;
      const containerWidth = container.clientWidth;
      if (containerWidth === 0) return;

      let lo = 24, hi = 800;
      while (lo < hi - 1) {
        const mid = Math.floor((lo + hi) / 2);
        title.style.fontSize = `${mid}px`;
        if (title.scrollWidth <= containerWidth) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      title.style.fontSize = `${lo}px`;
    };

    fit();

    const observer = new ResizeObserver(fit);
    const container = title.parentElement;
    if (container) observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const aboutSections = data.about.description
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);
  const keywordSection = aboutSections[aboutSections.length - 1] ?? "";
  const hasKeywordSection = keywordSection.includes("·");
  const aboutParagraphs = hasKeywordSection ? aboutSections.slice(0, -1) : aboutSections;
  const aboutKeywords = hasKeywordSection
    ? keywordSection.split("·").map((item) => item.trim()).filter(Boolean)
    : [];

  // Use real case data if featuredCases is provided, otherwise fall back to static items
  const projects = featuredCases && featuredCases.length > 0
    ? featuredCases
        .map(caseStudy => {
          // Validate required properties and provide defaults
          if (!caseStudy?.title || !caseStudy?.slug) {
            return null;
          }
          return {
            title: caseStudy.title,
            subtitle: caseStudy.subtitle || '',
            imageSrc: caseStudy.coverSrc || '',
            imageAlt: caseStudy.coverAlt || caseStudy.title,
            href: `/work/${caseStudy.slug}`
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .slice(0, data.pastProjects.maxItems ?? featuredCases.length)
    : data.pastProjects.items.slice(
        0,
        data.pastProjects.maxItems ?? data.pastProjects.items.length,
      );

  return (
    <article className={styles.page} aria-labelledby="home-title">
      <h1 id="home-title" className={styles.visuallyHidden}>
        Portfolio
      </h1>
      <section className={styles.hero}>
        <div className={styles.heroTitle}>
          <h1 aria-hidden="true" ref={heroTitleRef} className={styles.heroTitleText}>Portfolio</h1>
        </div>
        <p className={styles.heroHeadline}>{data.hero.headline}</p>
        <div className={styles.heroCtas}>
          <Button
            size="m"
            view="outlined"
            className={styles.heroCta}
            href={data.hero.ctaHref}
          >
            {data.hero.ctaLabel}
          </Button>
          <a className={styles.heroCtaSecondary} href={data.hero.secondaryCtaHref}>
            {data.hero.secondaryCtaLabel}
          </a>
        </div>
      </section>

      <section className={styles.about} aria-labelledby="about-title">
        <h2 id="about-title" className={styles.visuallyHidden}>
          About
        </h2>
        <div className={styles.aboutHeader}>
          <div className={styles.avatar}>
            <Image
              src={data.about.avatarSrc}
              alt={data.about.name}
              fill
              sizes="48px"
            />
          </div>
          <div className={styles.aboutIdentity}>
            <p className={styles.aboutName}>{data.about.name}</p>
            <p className={styles.aboutRole}>{data.about.role}</p>
          </div>
        </div>
        <div className={styles.aboutCopy}>
          {aboutParagraphs.map((paragraph, index) => (
            <p key={`${paragraph.slice(0, 24)}-${index}`} className={styles.aboutText}>
              {paragraph}
            </p>
          ))}
          {aboutKeywords.length > 0 ? (
            <ul className={styles.aboutKeywords} aria-label="Core focus areas">
              {aboutKeywords.map((keyword) => (
                <li key={keyword} className={styles.aboutKeyword}>
                  {keyword}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className={styles.cover} aria-labelledby="cover-title">
        <h2 id="cover-title" className={styles.visuallyHidden}>
          Cover
        </h2>
        <Image
          src={data.cover.src}
          alt={data.cover.alt}
          width={1080}
          height={559}
          sizes="(max-width: 1200px) 100vw, 1080px"
          className={styles.coverImage}
        />
      </section>

      <section className={styles.skillsTools} aria-labelledby="skills-title">
        <h2 id="skills-title" className={styles.visuallyHidden}>
          Skills and tools
        </h2>
        <div className={styles.skills}>
          <p className={styles.sectionLabel}>{data.skills.label}</p>
          <div className={styles.skillGroups}>
            {data.skills.groups.map((group) => (
              <div key={group.title} className={styles.skillGroup}>
                <p className={styles.skillTitle}>{group.title}</p>
                <ul className={styles.skillList}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.tools}>
          <p className={styles.sectionLabel}>{data.tools.label}</p>
          <div className={styles.toolGroups}>
            {data.tools.groups.map((group, index) => (
              <div key={group.title ?? index} className={styles.toolGroup}>
                {group.title ? (
                  <p className={styles.toolTitle}>{group.title}</p>
                ) : null}
                <ul className={styles.toolList}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.projectsSection} aria-labelledby="past-projects-title">
        <h2 id="past-projects-title" className={styles.visuallyHidden}>
          Past projects
        </h2>
        <p className={styles.sectionLabel}>{data.pastProjects.label}</p>
        <div className={styles.projectsGrid}>
          {projects.map((item, index) => {
            // Additional safety check - this should never be null due to filtering above
            if (!item || !item.title) return null;
            const content = (
              <>
                <div className={styles.projectImage}>
                  {item.imageSrc ? (
                    // Dynamic project image source may include external URLs from content.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageSrc} alt={item.imageAlt ?? item.title} />
                  ) : null}
                </div>
                <div className={styles.projectMeta}>
                  <div className={styles.projectText}>
                    <p className={styles.projectTitle}>{item.title}</p>
                    {item.subtitle ? (
                      <p className={styles.projectSubtitle}>{item.subtitle}</p>
                    ) : null}
                  </div>
                  <span className={styles.projectArrow} aria-hidden="true" />
                </div>
              </>
            );

            return item.href ? (
              <a
                key={`${item.title}-${index}`}
                className={styles.projectCard}
                href={item.href}
                onClick={() =>
                  trackEvent("case_click", {
                    label: item.title,
                    href: item.href,
                  })
                }
              >
                {content}
              </a>
            ) : (
              <div key={`${item.title}-${index}`} className={styles.projectCard}>
                {content}
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.resourcesSection} aria-labelledby="resources-title">
        <div className={styles.resourcesHeader}>
          <h2 id="resources-title" className={styles.sectionLabel}>
            {data.resources.label}
          </h2>
        </div>
        <div className={styles.resourcesGrid}>
          {data.resources.items.map((item, index) => {
            const label = item.linkLabel
              .replace(/[^\p{L}\p{N}\s-]/gu, "")
              .replace(/\s+/g, " ")
              .trim();
            return (
              <a
                key={`${item.title}-${index}`}
                className={styles.resourceCard}
                href={item.href}
                onClick={() =>
                  trackEvent("resource_click", {
                    label: item.title,
                    href: item.href,
                  })
                }
              >
                <p className={styles.resourceTitle}>{item.title}</p>
                <p className={styles.resourceDescription}>{item.description}</p>
                <span className={styles.resourceLink}>{label}</span>
              </a>
            );
          })}
        </div>
      </section>
    </article>
  );
}
