import { Check } from 'lucide-react';
import { Checkbox } from 'radix-ui';

import styles from './SubItemChecklist.module.scss';
import type { SubItem } from '../../models/Task';

interface SubItemChecklistProps {
  subItems: SubItem[];
  doneSubItemIds: string[];
  onToggle: (subItemId: string, done: boolean) => void;
}

const SubItemChecklist = ({
  subItems,
  doneSubItemIds,
  onToggle,
}: SubItemChecklistProps) => {
  if (subItems.length === 0) return null;

  return (
    <ul className={styles.list}>
      {subItems.map((subItem) => {
        const done = doneSubItemIds.includes(subItem.id);
        return (
          <li key={subItem.id} className={styles.item}>
            <Checkbox.Root
              className={styles.checkbox}
              checked={done}
              aria-label={subItem.text}
              onCheckedChange={(value) => onToggle(subItem.id, value === true)}
            >
              <Checkbox.Indicator>
                <Check size={12} aria-hidden="true" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <span className={done ? styles.doneText : styles.text}>
              {subItem.text}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default SubItemChecklist;
