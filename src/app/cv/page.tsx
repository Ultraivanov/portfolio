import type { Metadata } from "next";
import { Icon } from "@gravity-ui/uikit";
import { Paperclip } from "@gravity-ui/icons";
import { buildPageMetadata, SAME_AS_LINKS, SITE_NAME, SITE_URL } from "@/lib/seo";
import styles from "./cv-page.module.css";

const CV_TITLE = `CV — ${SITE_NAME}`;
const CV_DESCRIPTION =
  "Product Designer with 8+ years of hands-on design work, focused on business logic, monetization flows, access rules, conversion-critical UX, scalable design systems, and AI-native workflows.";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: CV_TITLE,
    description: CV_DESCRIPTION,
    path: "/cv",
    type: "profile",
    keywords: [
      "ai product designer cv",
      "agentic ux designer resume",
      "freelance product designer",
    ],
  }),
};

const skillsLine = (items: string[]) => items.join(" • ");

export default function CVPage() {
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: "Dmitry Ginzburg",
      alternateName: "Dima Ginzburg",
      jobTitle: "Product Designer",
      url: SITE_URL,
      sameAs: SAME_AS_LINKS,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
    <section className={styles.cvPage}>
      <div className={styles.cvContainer}>
        <header className={styles.cvHeader}>
          <span className={styles.cvHeaderName}>Dmitry Ginzburg</span>
          <span className={styles.cvHeaderDot}>•</span>
          <span className={styles.cvHeaderRole}>Product Designer</span>
        </header>

        <div className={styles.cvContacts}>
          <span>Haifa, Israel</span>
          <span className={styles.cvSeparator}>∙</span>
          <a href="https://wa.me/972533569957" target="_blank" rel="noreferrer">
            +972-53-356-9957
          </a>
          <span className={styles.cvSeparator}>∙</span>
          <a href="mailto:dima@ginzburg.work">dima@ginzburg.work</a>
          <span className={styles.cvSeparator}>∙</span>
          <a href="https://ginzburg.work" target="_blank" rel="noreferrer">
            portfolio
          </a>
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
            Product Designer with 8+ years of hands-on design work — and a
            decade of running businesses before that. I came to design from
            operating roles, so I design through business logic: monetization
            flows, access rules, conversion-critical UX, scalable design systems.
            Today I work AI-native, building design workflows around agentic
            tools and shipping my own AI-assisted products.
          </p>
        </section>

        <section className={styles.cvSection}>
          <p className={styles.cvSectionLabel}>Core Strengths</p>
          <ul className={styles.cvList}>
            <li>
              Designing flows and interaction models for complex products
            </li>
            <li>
              Translating business rules, access logic, and constraints into
              clear UX
            </li>
            <li>
              Building scalable design systems and structured UI
            </li>
            <li>Working AI-native with agentic design and development tools</li>
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
                "Component-based design",
                "Visual consistency",
              ])}
            </p>
          </div>
          <div className={styles.cvGroup}>
            <p className={styles.cvGroupTitle}>AI &amp; Agentic</p>
            <p className={styles.cvBody}>
              {skillsLine([
                "Codex",
                "Claude Code",
                "Cursor",
                "Windsurf",
                "Figma MCP",
                "Agentic workflow design",
              ])}
            </p>
          </div>
          <div className={styles.cvGroup}>
            <p className={styles.cvGroupTitle}>Tools</p>
            <p className={styles.cvBody}>
              {skillsLine(["Figma", "Sketch", "Framer"])}
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
                Led product design for a UGC game platform — flows, design
                system, and external-facing product narrative
              </li>
              <li>
                Structured product narrative, flows, and information to explain
                a complex platform to investors
              </li>
              <li>
                Defined product positioning and communication across external
                touchpoints
              </li>
              <li>
                Built a consistent visual system across all materials
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
                Built user journeys and purchase flows with clear access logic
                and constraints
              </li>
              <li>
                Developed and tested multiple sale models, influencing
                monetization and distribution strategy
              </li>
              <li>Result: $6M+ in sales volume and 16K NFTs sold</li>
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
                and improving usability at scale across 10+ internal services
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
                {` / Russia — Narrative UX Designer (Contractor)`}
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
          <p className={styles.cvSectionLabel}>AI &amp; Agentic Work</p>
          <ul className={styles.cvList}>
            <li>
              Designed and shipped browser-based product tools using AI-assisted
              development: an ATS resume parseability checker and a design-token
              auditor
            </li>
            <li>
              Developing “agent-native design systems” methodology — design
              tokens and components structured for consumption by AI agents, not
              only humans
            </li>
          </ul>
        </section>

        <section className={styles.cvSection}>
          <p className={styles.cvSectionLabel}>
            Earlier Career: Operating &amp; Executive Roles
          </p>
          <ul className={styles.cvList}>
            <li>
              C-level roles in e-commerce/marketplaces: growth, fundraising
              support, strategic initiatives (E96, Logo)
            </li>
            <li>
              C-level role in game publishing: marketing, distribution,
              go-to-market for published titles (iJet-Media)
            </li>
            <li>
              Editor-in-Chief and executive editorial roles: content strategy
              and audience growth (Kommersant-Yekaterinburg, Delovoy Kvartal,
              Business and Life)
            </li>
          </ul>
        </section>

        <section className={styles.cvSection}>
          <p className={styles.cvSectionLabel}>Education</p>
          <div className={styles.cvGroup}>
            <p className={styles.cvMuted}>1998-2003</p>
            <p className={styles.cvBody}>
              BA in Journalism — Ural Federal University (UrFU), Yekaterinburg,
              Russia
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
              Mini-MBA — CEEMAN / Adizes partner
            </p>
          </div>
        </section>

        <section className={styles.cvSection}>
          <p className={styles.cvSectionLabel}>Selected Portfolio</p>
          <ul className={styles.cvList}>
            <li>
              <a
                href="/work/megamod"
                target="_blank"
                rel="noreferrer"
              >
                Megamod
              </a>{" "}
              — Scaling product complexity through a unified communication layer
              (UX/UI Design)
            </li>
            <li>
              <a
                href="/work/travel-booking-platform"
                target="_blank"
                rel="noreferrer"
              >
                Russian Railways
              </a>{" "}
              — Turning a complex internal booking process into a predictable,
              repeatable system (Product Design)
            </li>
            <li>
              <a
                href="/work/railway-booking-flow"
                target="_blank"
                rel="noreferrer"
              >
                Russian Railways
              </a>{" "}
              — Designing a component-driven interaction system under legacy
              constraints (Product Design)
            </li>
            <li>
              <a
                href="/work/my-perfect-greek-vacation"
                target="_blank"
                rel="noreferrer"
              >
                Greek Vacation
              </a>{" "}
              — Helping users move from vague intent to confident booking
              (UX/UI Design)
            </li>
          </ul>
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
            Download PDF (108KB)
          </a>
        </div>
      </div>
    </section>
    </>
  );
}
