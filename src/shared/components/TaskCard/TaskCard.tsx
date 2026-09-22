import { type ReactNode, useId } from 'react';
import { Check, Repeat } from 'lucide-react';
import { Checkbox } from 'radix-ui';

import styles from './TaskCard.module.scss';
import type { Occurrence } from '../../models/Occurrence';
import type { RepeatKind } from '../../models/Task';
import { lightImpact } from '../../services/native/haptics';
import { SubItemChecklist } from '../SubItemChecklist';

type TaskCardVariant = 'default' | 'upNext' | 'overdue';

interface TaskCardProps {
  occurrence: Occurrence;
  variant?: TaskCardVariant;
  meta?: ReactNode;
  actions?: ReactNode;
  onToggleDone: (done: boolean) => void;
  onToggleSubItem: (subItemId: string, done: boolean) => void;
  onOpen?: () => void;
}

const repeatLabel: Record<Exclude<RepeatKind, 'none'>, string> = {
  daily: 'Repeats every day',
  weekdays: 'Repeats on weekdays',
  weekly: 'Repeats weekly',
};

const TaskCard = ({
  occurrence,
  variant = 'default',
  meta,
  actions,
  onToggleDone,
  onToggleSubItem,
  onOpen,
}: TaskCardProps) => {
  const titleId = useId();
  const variantClass =
    variant === 'upNext'
      ? styles.upNext
      : variant === 'overdue'
        ? styles.overdue
        : '';
  const className = [
    styles.card,
    variantClass,
    occurrence.done ? styles.done : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={className} aria-label={occurrence.title}>
      <div className={styles.row}>
        <Checkbox.Root
          className={styles.checkbox}
          checked={occurrence.done}
          aria-label={`Mark ${occurrence.title} done`}
          onCheckedChange={(value) => {
            lightImpact();
            onToggleDone(value === true);
          }}
        >
          <Checkbox.Indicator>
            <Check size={14} aria-hidden="true" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <div className={styles.body}>
          <div className={styles.titleRow}>
            {onOpen ? (
              <button
                type="button"
                id={titleId}
                className={styles.titleButton}
                onClick={onOpen}
              >
                {occurrence.title}
              </button>
            ) : (
              <span id={titleId} className={styles.title}>
                {occurrence.title}
              </span>
            )}
            {occurrence.repeatKind !== 'none' ? (
              <Repeat
                className={styles.repeat}
                size={14}
                role="img"
                aria-label={repeatLabel[occurrence.repeatKind]}
              />
            ) : null}
          </div>
          {meta ? <div className={styles.meta}>{meta}</div> : null}
          <SubItemChecklist
            subItems={occurrence.subItems}
            doneSubItemIds={occurrence.doneSubItemIds}
            onToggle={onToggleSubItem}
          />
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      </div>
    </article>
  );
};

export default TaskCard;
