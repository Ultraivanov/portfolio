"use client";

import Image from "next/image";
import { Button } from "@gravity-ui/uikit";
import { useThemeMode } from "@/components/ClientProviders";
import CaseList from "@/components/case-list/CaseList";
import type { HomeContent } from "@/content/home";
import styles from "./home-page.module.css";

type HomePageProps = {
  data: HomeContent;
};

export default function HomePage({ data }: HomePageProps) {
  const { theme } = useThemeMode();
  const titleSrc =
    theme === "light" ? "/home/hero-title-dark.svg" : data.hero.titleImageSrc;

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
        <Button
          size="m"
          view="outlined"
          className={styles.heroCta}
          href={data.hero.ctaHref}
        >
          {data.hero.ctaLabel}
        </Button>
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
              <ul key={index} className={styles.toolList}>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="past-projects-title">
        <h2 id="past-projects-title" className={styles.visuallyHidden}>
          Past projects
        </h2>
        <CaseList data={data.pastProjects} />
      </section>
    </article>
  );
}
