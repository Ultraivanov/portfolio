"use client";

import Image from "next/image";
import { Button } from "@gravity-ui/uikit";
import { useThemeMode } from "@/components/ClientProviders";
import type { HomeContent, PastProject } from "@/content/home";
import styles from "./home-page.module.css";

type HomePageProps = {
  data: HomeContent;
};

export default function HomePage({ data }: HomePageProps) {
  const { theme } = useThemeMode();
  const titleSrc =
    theme === "light" ? "/home/hero-title-dark.svg" : data.hero.titleImageSrc;

  const projects = data.pastProjects.items.slice(
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
          <img src={titleSrc} alt={data.hero.titleImageAlt} />
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
        <p className={styles.aboutText}>{data.about.description}</p>
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
          {projects.map((item: PastProject, index) => {
            const content = (
              <>
                <div className={styles.projectImage}>
                  {item.imageSrc ? (
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
            const label = item.linkLabel.replace(/→/gu, "").trim();
            return (
              <a
                key={`${item.title}-${index}`}
                className={styles.resourceCard}
                href={item.href}
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
