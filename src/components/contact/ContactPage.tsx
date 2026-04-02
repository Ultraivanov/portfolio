import type { ContactContent } from "@/content/contact";
import ContactForm from "./ContactForm";
import styles from "./contact-page.module.css";

type ContactPageProps = {
  data: ContactContent;
};

export default function ContactPage({ data }: ContactPageProps) {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Contact</p>
        <h1 className={styles.title}>{data.title}</h1>
        <p className={styles.subtitle}>{data.subtitle}</p>
      </header>
      <div className={styles.grid}>
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Email</span>
            <a className={styles.detailValue} href={`mailto:${data.email}`}>
              {data.email}
            </a>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Availability</span>
            <span className={styles.detailValue}>{data.availability}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Location</span>
            <span className={styles.detailValue}>{data.location}</span>
          </div>
          <p className={styles.note}>{data.note}</p>
        </div>
        <ContactForm email={data.email} />
      </div>
    </article>
  );
}
