import { Plus } from 'lucide-react';

import styles from './FloatingAddButton.module.scss';
import type { DateKey } from '../../models/Task';
import { useAppDispatch } from '../../../store/hooks';
import { openCreate } from '../../../store/taskEditorSlice';

interface FloatingAddButtonProps {
  date: DateKey;
}

const FloatingAddButton = ({ date }: FloatingAddButtonProps) => {
  const dispatch = useAppDispatch();

  return (
    <button
      type="button"
      className={styles.button}
      aria-label="Add task"
      onClick={() => dispatch(openCreate(date))}
    >
      <Plus size={28} aria-hidden="true" />
    </button>
  );
};

export default FloatingAddButton;
