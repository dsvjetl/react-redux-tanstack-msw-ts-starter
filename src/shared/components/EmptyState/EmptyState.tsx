import { useId } from 'react';

import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  const headingId = useId();

  return (
    <section className={styles.container} aria-labelledby={headingId}>
      <div className={styles.art} aria-hidden="true" />
      <h2 id={headingId} className={styles.title}>
        {title}
      </h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {actionLabel && onAction ? (
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
};

export default EmptyState;
