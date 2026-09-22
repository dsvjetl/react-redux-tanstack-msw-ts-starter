import { AlertDialog } from 'radix-ui';

import styles from './SeriesScopeDialog.module.scss';
import type { SeriesScope } from '../../utils/plannerCommands';

interface SeriesScopeDialogProps {
  open: boolean;
  onChoose: (scope: SeriesScope) => void;
  onCancel: () => void;
}

const SeriesScopeDialog = ({
  open,
  onChoose,
  onCancel,
}: SeriesScopeDialogProps) => {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.overlay} />
        <AlertDialog.Content className={styles.content}>
          <AlertDialog.Title className={styles.title}>
            Apply to which occurrences?
          </AlertDialog.Title>
          <AlertDialog.Description className={styles.description}>
            This task repeats. Choose how far the change should reach.
          </AlertDialog.Description>
          <div className={styles.actions}>
            <AlertDialog.Action asChild>
              <button
                type="button"
                className={styles.option}
                onClick={() => onChoose('this')}
              >
                This occurrence only
              </button>
            </AlertDialog.Action>
            <AlertDialog.Action asChild>
              <button
                type="button"
                className={styles.option}
                onClick={() => onChoose('future')}
              >
                This and all future occurrences
              </button>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <button type="button" className={styles.cancel}>
                Cancel
              </button>
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default SeriesScopeDialog;
