"use client";

import { useCallback, useState } from "react";
import { Button, TextArea, TextInput } from "@gravity-ui/uikit";
import { trackEvent } from "@/lib/analytics";
import { jsonPost } from "@/lib/api";
import TurnstileWidget from "./TurnstileWidget";
import styles from "./contact-form.module.css";

type ContactFormProps = {
  email: string;
};

type FormStatus = "idle" | "sending" | "success" | "error";

type ContactPayload = {
  name: string;
  company: string;
  email: string;
  message: string;
  page: string;
  captchaToken: string;
};

export default function ContactForm({ email }: ContactFormProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const handleCaptchaStateChange = useCallback((token: string | null) => {
    setCaptchaToken(token || "");
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    // Honeypot check
    if (honeypot) {
      return;
    }

    // Validate required fields
    if (!name || !contactEmail || !message) {
      setStatus("error");
      setError("Please fill in name, email, and message.");
      return;
    }

    // Validate captcha configuration
    if (!turnstileSiteKey) {
      setStatus("error");
      setError("Captcha is not configured.");
      return;
    }

    // Validate captcha token
    if (!captchaToken) {
      setStatus("error");
      setError("Please complete the captcha.");
      return;
    }

    // Validate consent
    if (!consent) {
      setStatus("error");
      setError("Please confirm you agree to the Privacy Policy.");
      return;
    }

    setStatus("sending");
    try {
      const payload: ContactPayload = {
        name,
        company,
        email: contactEmail,
        message,
        page: window.location.href,
        captchaToken,
      };

      await jsonPost("/api/contact", payload);

      setStatus("success");
      trackEvent("contact_submit", { status: "success" });

      // Reset form
      setName("");
      setCompany("");
      setMessage("");
      setContactEmail("");
      setConsent(false);
      setCaptchaToken("");
      setCaptchaReset((prev) => prev + 1);
    } catch (err) {
      setStatus("error");
      trackEvent("contact_submit", { status: "error" });
      setError(
        `Something went wrong. Please email directly at ${email}.`,
      );
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="contact-name">
          Name
        </label>
        <TextInput
          id="contact-name"
          name="name"
          size="l"
          view="normal"
          value={name}
          onUpdate={setName}
          placeholder="Your name"
          autoComplete="name"
          aria-required="true"
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="contact-email">
          Email
        </label>
        <TextInput
          id="contact-email"
          name="email"
          size="l"
          view="normal"
          value={contactEmail}
          onUpdate={setContactEmail}
          placeholder="you@company.com"
          autoComplete="email"
          type="email"
          aria-required="true"
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="contact-company">
          Company
        </label>
        <TextInput
          id="contact-company"
          name="company"
          size="l"
          view="normal"
          value={company}
          onUpdate={setCompany}
          placeholder="Company or product"
          autoComplete="organization"
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="contact-message">
          Message
        </label>
        <TextArea
          id="contact-message"
          name="message"
          size="l"
          view="normal"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Project context, timeline, and the decision owner"
          minRows={6}
          aria-required="true"
        />
      </div>

      <input
        className={styles.honeypot}
        type="text"
        name="website"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
        />
        <span>
          I agree to the <a href="/privacy">Privacy Policy</a>.
        </span>
      </label>

      {turnstileSiteKey ? (
        <div className={styles.captchaField}>
          <span className={styles.captchaLabel}>Verification</span>
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            resetKey={captchaReset}
            onVerify={(token) => handleCaptchaStateChange(token)}
            onExpire={() => handleCaptchaStateChange(null)}
            onError={() => handleCaptchaStateChange(null)}
          />
        </div>
      ) : null}

      <Button
        size="l"
        view="outlined"
        className={styles.submit}
        type="submit"
        loading={status === "sending"}
        disabled={status === "sending"}
      >
        Send message
      </Button>

      {status === "success" ? (
        <p className={styles.statusSuccess} role="status">
          Message sent. I will reply with next steps.
        </p>
      ) : null}
      {status === "error" ? (
        <p className={styles.statusError} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
