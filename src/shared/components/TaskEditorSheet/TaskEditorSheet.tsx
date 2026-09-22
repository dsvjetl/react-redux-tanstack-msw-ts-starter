import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import styles from './TaskEditorSheet.module.scss';
import {
  type TaskFormValues,
  emptyFormValues,
  formValuesFromOccurrence,
  formValuesFromTask,
  taskFormValuesSchema,
  toTaskInput,
} from './taskFormSchema';
import { usePlannerMutations } from '../../hooks/usePlannerMutations';
import { useTasks } from '../../hooks/useTasks';
import type { PlannerDocument } from '../../models/PlannerDocument';
import {
  type DateKey,
  SUB_ITEM_LIMIT,
  type Weekday,
  isRepeating,
} from '../../models/Task';
import { findOccurrence } from '../../utils/occurrences';
import type { SeriesScope } from '../../utils/plannerCommands';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { type TaskEditorState, close } from '../../../store/taskEditorSlice';
import { ErrorState } from '../ErrorState';
import { RepeatRulePicker } from '../RepeatRulePicker';
import { SeriesScopeDialog } from '../SeriesScopeDialog';

type EditorContext =
  | { kind: 'create'; key: string; defaults: TaskFormValues }
  | { kind: 'edit-task'; key: string; taskId: string; defaults: TaskFormValues }
  | {
      kind: 'edit-occurrence';
      key: string;
      taskId: string;
      date: DateKey;
      defaults: TaskFormValues;
    };

const resolveContext = (
  editor: TaskEditorState,
  doc: PlannerDocument,
): EditorContext | null => {
  if (editor.mode === 'closed') return null;
  if (editor.mode === 'create') {
    return {
      kind: 'create',
      key: `create-${editor.date}`,
      defaults: emptyFormValues(editor.date),
    };
  }
  const task = doc.tasks.find((t) => t.id === editor.taskId);
  if (!task) return null;
  if (!isRepeating(task)) {
    return {
      kind: 'edit-task',
      key: `task-${task.id}`,
      taskId: task.id,
      defaults: formValuesFromTask(task),
    };
  }
  const occurrence = findOccurrence(doc, task.id, editor.date);
  if (!occurrence) return null;
  return {
    kind: 'edit-occurrence',
    key: `occurrence-${task.id}-${editor.date}`,
    taskId: task.id,
    date: editor.date,
    defaults: formValuesFromOccurrence(task, occurrence),
  };
};

interface EditorFormProps {
  context: EditorContext;
  onClose: () => void;
}

const EditorForm = ({ context, onClose }: EditorFormProps) => {
  const { createTask, updateTask, updateOccurrence } = usePlannerMutations();
  const [pendingValues, setPendingValues] = useState<TaskFormValues | null>(
    null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormValuesSchema),
    defaultValues: context.defaults,
    mode: 'onSubmit',
  });
  const subItems = useFieldArray({ control, name: 'subItems' });
  const repeatKind = watch('repeatKind');
  const weeklyDays = watch('weeklyDays') as Weekday[];

  const persist = async (values: TaskFormValues, scope?: SeriesScope) => {
    setSubmitting(true);
    setSaveError(null);
    try {
      const input = toTaskInput(values);
      if (context.kind === 'create') {
        await createTask(input);
      } else if (context.kind === 'edit-task') {
        await updateTask(context.taskId, input);
      } else {
        await updateOccurrence(context.taskId, context.date, scope ?? 'this', {
          title: input.title,
          time: input.time,
          subItems: input.subItems,
          repeat: scope === 'future' ? input.repeat : undefined,
        });
      }
      onClose();
    } catch {
      setSaveError("Couldn't save. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (values: TaskFormValues) => {
    if (context.kind === 'edit-occurrence') {
      setPendingValues(values);
      return;
    }
    void persist(values);
  };

  const isOccurrence = context.kind === 'edit-occurrence';
  const weeklyError = errors.weeklyDays?.message as string | undefined;

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {saveError ? <ErrorState message={saveError} /> : null}

      <div className={styles.field}>
        <label htmlFor="task-title" className={styles.label}>
          Title
        </label>
        <input
          id="task-title"
          className={styles.input}
          autoComplete="off"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'task-title-error' : undefined}
          {...register('title')}
        />
        {errors.title ? (
          <p id="task-title-error" className={styles.error}>
            {errors.title.message}
          </p>
        ) : null}
      </div>

      {!isOccurrence ? (
        <div className={styles.field}>
          <label htmlFor="task-date" className={styles.label}>
            Date
          </label>
          <input
            id="task-date"
            type="date"
            className={styles.input}
            aria-invalid={errors.startDate ? true : undefined}
            {...register('startDate')}
          />
          {errors.startDate ? (
            <p className={styles.error}>{errors.startDate.message}</p>
          ) : null}
        </div>
      ) : null}

      <div className={styles.field}>
        <label htmlFor="task-time" className={styles.label}>
          Time
        </label>
        <div className={styles.inline}>
          <input
            id="task-time"
            type="time"
            step={300}
            className={styles.input}
            aria-invalid={errors.time ? true : undefined}
            {...register('time')}
          />
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => setValue('time', '', { shouldDirty: true })}
          >
            Clear time
          </button>
        </div>
        {errors.time ? (
          <p className={styles.error}>{errors.time.message}</p>
        ) : null}
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Repeat</span>
        <Controller
          control={control}
          name="repeatKind"
          render={({ field }) => (
            <RepeatRulePicker
              kind={field.value}
              weeklyDays={weeklyDays}
              onKindChange={field.onChange}
              onWeeklyDaysChange={(days) =>
                setValue('weeklyDays', days, {
                  shouldDirty: true,
                  shouldValidate: !!weeklyError,
                })
              }
              error={repeatKind === 'weekly' ? weeklyError : undefined}
            />
          )}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Sub-items</span>
        <ul className={styles.subItems} aria-label="Sub-items">
          {subItems.fields.map((field, index) => (
            <li key={field.id} className={styles.subItemRow}>
              <input
                className={styles.input}
                aria-label={`Sub-item ${index + 1}`}
                aria-invalid={errors.subItems?.[index]?.text ? true : undefined}
                {...register(`subItems.${index}.text` as const)}
              />
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`Remove sub-item ${index + 1}`}
                onClick={() => subItems.remove(index)}
              >
                <X size={16} aria-hidden="true" />
              </button>
              {errors.subItems?.[index]?.text ? (
                <p className={styles.errorFull}>
                  {errors.subItems[index]?.text?.message}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={styles.ghostButton}
          disabled={subItems.fields.length >= SUB_ITEM_LIMIT}
          onClick={() => subItems.append({ text: '' })}
        >
          <Plus size={16} aria-hidden="true" /> Add sub-item
        </button>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className={styles.save} disabled={submitting}>
          Save
        </button>
      </div>

      <SeriesScopeDialog
        open={pendingValues !== null}
        onChoose={(scope) => {
          const values = pendingValues;
          setPendingValues(null);
          if (values) void persist(values, scope);
        }}
        onCancel={() => setPendingValues(null)}
      />
    </form>
  );
};

const TaskEditorSheet = () => {
  const editor = useAppSelector((state) => state.taskEditor);
  const dispatch = useAppDispatch();
  const { doc } = useTasks();
  const context = useMemo(() => resolveContext(editor, doc), [editor, doc]);
  const open = context !== null;
  const onClose = () => dispatch(close());

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.sheet} aria-describedby={undefined}>
          <div className={styles.handle} aria-hidden="true" />
          <Dialog.Title className={styles.title}>
            {context?.kind === 'create' ? 'New task' : 'Edit task'}
          </Dialog.Title>
          {context ? (
            <EditorForm key={context.key} context={context} onClose={onClose} />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default TaskEditorSheet;
