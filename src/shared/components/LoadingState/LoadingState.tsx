import styles from './LoadingState.module.scss';

interface LoadingStateProps {
  label?: string;
}

const LoadingState = ({ label = 'Loading your tasks' }: LoadingStateProps) => {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};

export default LoadingState;
