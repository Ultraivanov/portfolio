import type { Metadata } from "next";
import { Icon } from "@gravity-ui/uikit";
import { Paperclip } from "@gravity-ui/icons";
import { SITE_NAME } from "@/lib/seo";
import styles from "./cv-page.module.css";

const CV_TITLE = `CV — ${SITE_NAME}`;
const CV_DESCRIPTION =
  "Product Designer working on products with complex logic — including monetization systems, internal platforms, and early-stage products.";

export const metadata: Metadata = {
  title: CV_TITLE,
  description: CV_DESCRIPTION,
  alternates: {
    canonical: "/cv",
  },
  openGraph: {
    title: CV_TITLE,
    description: CV_DESCRIPTION,
    url: "/cv",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: CV_TITLE,
    description: CV_DESCRIPTION,
  },
};

const skillsLine = (items: string[]) => items.join(" • ");

export default function CVPage() {
  return (
    <section className={styles.cvPage}>
      <div className={styles.cvContainer}>
        <header className={styles.cvHeader}>
          <span className={styles.cvHeaderName}>Dmitry Ginzburg</span>
          <span className={styles.cvHeaderDot}>•</span>
          <span className={styles.cvHeaderRole}>Product Designer</span>
        </header>

        <div className={styles.cvContacts}>
          <span>Israel</span>
          <span className={styles.cvSeparator}>∙</span>
          <span>phone +972533569957</span>
          <span className={styles.cvSeparator}>∙</span>
          <a href="mailto:dima@ginzburg.work">dima@ginzburg.work</a>
          <span className={styles.cvSeparator}>∙</span>
          <a
            href="https://www.linkedin.com/in/dmitry-ginzburg-profit/"
            target="_blank"
            rel="noreferrer"
          >
            linkedIn
          </a>
          <span className={styles.cvSeparator}>∙</span>
          <a
            href="https://github.com/Ultraivanov"
            target="_blank"
            rel="noreferrer"
          >
            github
          </a>
        </div>

        <section className={styles.cvSection}>
          <p className={styles.cvSectionLabel}>summary</p>
          <p className={styles.cvBody}>
            Product Designer working on products with complex logic — including
            monetization systems, internal platforms, and early-stage products.
            I design user flows, interfaces, and interaction models that make
            complex systems understandable and usable, with impact on conversion,
            efficiency, and product adoption.
          </p>
        </section>

        <section className={styles.cvSection}>
          <p className={styles.cvSectionLabel}>Core Strengths</p>
          <ul className={styles.cvList}>
            <li>
              Designing flows and interaction models for complex products
            </li>
            <li>
              Translating business rules and constraints into clear UX
            </li>
            <li>
              Building scalable design systems and structured UI
            </li>
            <li>Working across 0→1 and growth stages</li>
          </ul>
        </section>

        <section className={styles.cvSection}>
          <p className={styles.cvSectionLabel}>skills</p>
          <div className={styles.cvGroup}>
            <p className={styles.cvGroupTitle}>Product &amp; UX</p>
            <p className={styles.cvBody}>
              {skillsLine([
                "User flows",
                "Interaction design",
                "Information architecture",
                "Design systems",
                "Prototyping",
              ])}
            </p>
          </div>
          <div className={styles.cvGroup}>
            <p className={styles.cvGroupTitle}>Research &amp; Validation</p>
            <p className={styles.cvBody}>
              {skillsLine([
                "JTBD",
                "CJM",
                "User interviews",
                "A/B testing",
              ])}
            </p>
          </div>
          <div className={styles.cvGroup}>
            <p className={styles.cvGroupTitle}>UI &amp; Visual</p>
            <p className={styles.cvBody}>
              {skillsLine([
                "Layout",
                "Typography",
                "Component systems",
                "Visual consistency",
              ])}
            </p>
          </div>
          <div className={styles.cvGroup}>
            <p className={styles.cvGroupTitle}>Tools</p>
            <p className={styles.cvBody}>
              {skillsLine(["Figma", "Codex", "Framer"])}
            </p>
          </div>
        </section>

        <section className={styles.cvSection}>
          <p className={styles.cvSectionLabel}>Experience</p>

          <div className={styles.cvExperience}>
            <div className={styles.cvExperienceHeader}>
              <p>
                <a
                  href="https://investors.megamod.io"
                  target="_blank"
                  rel="noreferrer"
                >
                  Megamod
                </a>
                {` / USA — Founding Product Designer`}
              </p>
              <span className={styles.cvDate}>Aug 2023 – nov 2025</span>
            </div>
            <p className={styles.cvBody}>
              Early-stage UGC game platform preparing for institutional
              fundraising and external positioning.
            </p>
            <ul className={styles.cvList}>
              <li>
                Defined how the product is structured and communicated for
                external audiences, translating a complex platform model into
                clear product flows and narrative
              </li>
              <li>
                Designed investor-facing website and materials, aligning product
                logic, positioning, and visual system
              </li>
              <li>
                Contributed to a $7M funding round at a $25M valuation
              </li>
              <li>
                Built reusable design system and workflows, reducing production
                time by 30–40%
              </li>
            </ul>
          </div>

          <div className={styles.cvExperience}>
            <div className={styles.cvExperienceHeader}>
              <p>OnlySpace / UAE — UX Designer</p>
              <span className={styles.cvDate}>Feb 2022 – Mar 2023</span>
            </div>
            <p className={styles.cvBody}>
              Web3 game publisher (Xsolla, Com2us)
            </p>
            <ul className={styles.cvList}>
              <li>
                Designed end-to-end UX for limited-supply NFT sales, including
                access logic, eligibility rules, and purchase flows
              </li>
              <li>
                Built pre-sale journeys (discovery, ожидание, phased access),
                improving conversion under high demand
              </li>
              <li>
                Developed and tested multiple sale models, influencing
                monetization and distribution strategy
              </li>
              <li>Result: $6M+ in volume and 16K NFTs sold</li>
            </ul>
          </div>

          <div className={styles.cvExperience}>
            <div className={styles.cvExperienceHeader}>
              <p>OCRV / Russian Railways — Product Designer</p>
              <span className={styles.cvDate}>Feb 2020– Jan 2022</span>
            </div>
            <p className={styles.cvBody}>
              Enterprise platform (3M+ users, 10+ internal services: booking,
              travel, document management and workflow systems)
            </p>
            <ul className={styles.cvList}>
              <li>
                Redesigned UX across multiple services, simplifying workflows
                and improving usability at scale
              </li>
              <li>
                Defined interaction patterns across B2B, B2C, and operational
                tools
              </li>
              <li>
                Result: ~200,000 hours saved annually, ~$3M cost reduction
              </li>
            </ul>
          </div>

          <div className={styles.cvExperience}>
            <div className={styles.cvExperienceHeader}>
              <p>
                <a
                  href="https://prostor.io/en/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Prostor
                </a>
                {` / Russia — Junior UX/UI Designer (Discovery & Narrative UX • Contractor)`}
              </p>
              <span className={styles.cvDate}>Jan 2017 – Feb 2020</span>
            </div>
            <p className={styles.cvBody}>
              Product development and Design Agency
            </p>
            <ul className={styles.cvList}>
              <li>Led discovery workshops with founders and teams</li>
              <li>
                Translated business goals into product concepts and UX
                prototypes
              </li>
              <li>Supported early-stage product validation</li>
            </ul>
          </div>
        </section>

        <section className={styles.cvSection}>
          <p className={styles.cvSectionLabel}>Earlier Experience</p>
          <ul className={styles.cvList}>
            <li>
              <strong>E-commerce / Marketplaces</strong> — C-level roles focused
              on growth, fundraising support, and strategic initiatives (E96,
              Logo).
            </li>
            <li>
              <strong>Gaming / Game Publishing</strong> — C-level role owning
              marketing, distribution, and go-to-market strategy for published
              titles.
            </li>
            <li>
              <strong>Media</strong> — Executive editorial roles up to
              Editor-in-Chief, owning content strategy, narratives, and audience
              growth (Kommersant, Delovoy Kvartal, Bussiness and Life)
            </li>
          </ul>
        </section>

        <section className={styles.cvSection}>
          <p className={styles.cvSectionLabel}>Education</p>
          <div className={styles.cvGroup}>
            <p className={styles.cvMuted}>1998-2003</p>
            <p className={styles.cvBody}>
              BA of Journalism — UrFU (Russia, Yekaterinburg)
            </p>
          </div>
          <div className={styles.cvGroup}>
            <p className={styles.cvMuted}>Courses</p>
            <p className={styles.cvBody}>
              Google • UX Design (verify at{" "}
              <a
                href="https://www.coursera.org/account/accomplishments/verify/UBHTWH9JEEMD?utm_source=ln&utm_medium=certificate&utm_content=cert_image&utm_campaign=pdf_header_button&utm_product=course"
                target="_blank"
                rel="noreferrer"
              >
                Coursera
              </a>
              )
            </p>
            <p className={styles.cvBody}>
              CalArts • Graphic Design (verify at{" "}
              <a
                href="https://www.coursera.org/account/accomplishments/verify/AWHBV36E97ED"
                target="_blank"
                rel="noreferrer"
              >
                Coursera
              </a>
              )
            </p>
            <p className={styles.cvBody}>
              CEEMAN/Adizes partner • Mini-MBA
            </p>
          </div>
        </section>

        <div className={styles.cvDownload}>
          <a
            className={styles.cvDownloadLink}
            href="/cv/dmitry-ginzburg-cv.pdf"
            download
          >
            <Icon
              data={Paperclip}
              size={14}
              className={styles.cvDownloadIcon}
              aria-hidden="true"
            />
            Download PDF (2MB)
          </a>
        </div>
      </div>
    </section>
  );
}
