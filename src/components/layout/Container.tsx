import type { ReactNode } from "react";
import styles from "./layout.module.css";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export default function Container({ children, className }: ContainerProps) {
  const classes = className
    ? `${styles.container} ${className}`
    : styles.container;

  return <div className={classes}>{children}</div>;
}
