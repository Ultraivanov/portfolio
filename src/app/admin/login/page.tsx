"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

type LoginResponse = {
  ok?: boolean;
  error?: {
    message?: string;
  };
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextValue = params.get("next");
    if (nextValue && nextValue.startsWith("/admin")) {
      setNextPath(nextValue);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as LoginResponse;
        setError(payload.error?.message || "Login failed.");
        return;
      }

      router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin");
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Network error during login.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1 className={styles.title}>CMS Login</h1>
        <p className={styles.subtitle}>Sign in to access portfolio content management.</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="cms-username">
              Username
            </label>
            <input
              id="cms-username"
              className={styles.input}
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="cms-password">
              Password
            </label>
            <input
              id="cms-password"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className={styles.actions}>
            <button className={styles.button} type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}
