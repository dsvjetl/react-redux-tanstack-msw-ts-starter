import styles from './ErrorState.module.scss';

interface ErrorStateProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorState = ({ message, onDismiss }: ErrorStateProps) => {
  return (
    <div className={styles.container} role="alert">
      <span className={styles.message}>{message}</span>
      {onDismiss ? (
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
};

export default ErrorState;
