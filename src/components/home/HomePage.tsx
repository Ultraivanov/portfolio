"use client";

import Image from "next/image";
import { Button } from "@gravity-ui/uikit";
import CaseList from "@/components/case-list/CaseList";
import type { HomeContent } from "@/content/home";
import styles from "./home-page.module.css";

type HomePageProps = {
  data: HomeContent;
};

export default function HomePage({ data }: HomePageProps) {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroTitle}>
          <Image
            src={data.hero.titleImageSrc}
            alt={data.hero.titleImageAlt}
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1080px"
          />
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
      </div>

      <div className={styles.about}>
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
      </div>

      <div className={styles.cover}>
        <Image
          src={data.cover.src}
          alt={data.cover.alt}
          width={1080}
          height={559}
          sizes="(max-width: 1200px) 100vw, 1080px"
          className={styles.coverImage}
        />
      </div>

      <div className={styles.skillsTools}>
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
      </div>

      <CaseList data={data.pastProjects} />
    </section>
  );
}
