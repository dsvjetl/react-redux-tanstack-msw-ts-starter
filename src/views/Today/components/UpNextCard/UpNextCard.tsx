import styles from './UpNextCard.module.scss';
import type { Occurrence } from '../../../../shared/models/Occurrence';
import { formatTimeLabel } from '../../../../shared/utils/date';

interface UpNextCardProps {
  occurrence: Occurrence;
  onOpen?: () => void;
}

const UpNextCard = ({ occurrence, onOpen }: UpNextCardProps) => {
  return (
    <section className={styles.card} aria-label="Up next">
      <p className={styles.kicker}>Up next</p>
      <div className={styles.row}>
        {onOpen ? (
          <button type="button" className={styles.titleButton} onClick={onOpen}>
            {occurrence.title}
          </button>
        ) : (
          <h2 className={styles.title}>{occurrence.title}</h2>
        )}
        {occurrence.time ? (
          <span className={styles.time}>
            {formatTimeLabel(occurrence.time)}
          </span>
        ) : null}
      </div>
      {occurrence.subItems.length > 0 ? (
        <ul className={styles.subItems}>
          {occurrence.subItems.map((subItem) => (
            <li key={subItem.id}>{subItem.text}</li>
          ))}
        </ul>
      ) : null}
      <span className={styles.orb} aria-hidden="true" />
    </section>
  );
};

export default UpNextCard;
