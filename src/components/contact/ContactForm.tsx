"use client";

import { useMemo, useState } from "react";
import { Button, TextArea, TextInput } from "@gravity-ui/uikit";
import styles from "./contact-form.module.css";

type ContactFormProps = {
  email: string;
};

export default function ContactForm({ email }: ContactFormProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const mailto = useMemo(() => {
    const subject = name ? `Portfolio inquiry from ${name}` : "Portfolio inquiry";
    const body = [
      name && `Name: ${name}`,
      company && `Company: ${company}`,
      contactEmail && `Email: ${contactEmail}`,
      message && `\n${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [company, contactEmail, email, message, name]);

  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="contact-name">
          Name
        </label>
        <TextInput
          id="contact-name"
          size="l"
          view="normal"
          value={name}
          onUpdate={setName}
          placeholder="Your name"
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="contact-email">
          Email
        </label>
        <TextInput
          id="contact-email"
          size="l"
          view="normal"
          value={contactEmail}
          onUpdate={setContactEmail}
          placeholder="you@company.com"
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="contact-company">
          Company
        </label>
        <TextInput
          id="contact-company"
          size="l"
          view="normal"
          value={company}
          onUpdate={setCompany}
          placeholder="Company or product"
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="contact-message">
          Message
        </label>
        <TextArea
          id="contact-message"
          size="l"
          view="normal"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Project context, timeline, and the decision owner"
          minRows={6}
        />
      </div>
      <Button size="l" view="outlined" className={styles.submit} href={mailto}>
        Send message
      </Button>
    </form>
  );
}
