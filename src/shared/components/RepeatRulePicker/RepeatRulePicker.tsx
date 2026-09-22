import { useId } from 'react';
import { RadioGroup } from 'radix-ui';

import styles from './RepeatRulePicker.module.scss';
import type { RepeatKind, Weekday } from '../../models/Task';

interface RepeatRulePickerProps {
  kind: RepeatKind;
  weeklyDays: Weekday[];
  onKindChange: (kind: RepeatKind) => void;
  onWeeklyDaysChange: (days: Weekday[]) => void;
  error?: string;
}

const kinds: Array<{ value: RepeatKind; label: string }> = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
];

const weekdays: Array<{ value: Weekday; label: string }> = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

const RepeatRulePicker = ({
  kind,
  weeklyDays,
  onKindChange,
  onWeeklyDaysChange,
  error,
}: RepeatRulePickerProps) => {
  const id = useId();
  const errorId = `${id}-error`;

  const toggleDay = (day: Weekday, checked: boolean) => {
    const next = checked
      ? [...weeklyDays, day].sort((a, b) => a - b)
      : weeklyDays.filter((d) => d !== day);
    onWeeklyDaysChange(Array.from(new Set(next)) as Weekday[]);
  };

  return (
    <div className={styles.container}>
      <RadioGroup.Root
        className={styles.radioGroup}
        aria-label="Repeat"
        value={kind}
        onValueChange={(value) => onKindChange(value as RepeatKind)}
      >
        {kinds.map((option) => (
          <label key={option.value} className={styles.radioLabel}>
            <RadioGroup.Item className={styles.radio} value={option.value}>
              <RadioGroup.Indicator className={styles.radioIndicator} />
            </RadioGroup.Item>
            <span>{option.label}</span>
          </label>
        ))}
      </RadioGroup.Root>

      {kind === 'weekly' ? (
        <fieldset
          className={styles.days}
          aria-describedby={error ? errorId : undefined}
        >
          <legend className={styles.legend}>Repeat on</legend>
          <div className={styles.dayRow}>
            {weekdays.map((day) => {
              const checked = weeklyDays.includes(day.value);
              return (
                <label
                  key={day.value}
                  className={checked ? styles.dayChecked : styles.day}
                >
                  <input
                    type="checkbox"
                    className={styles.dayInput}
                    checked={checked}
                    onChange={(event) =>
                      toggleDay(day.value, event.target.checked)
                    }
                  />
                  {day.label}
                </label>
              );
            })}
          </div>
          {error ? (
            <p id={errorId} className={styles.error}>
              {error}
            </p>
          ) : null}
        </fieldset>
      ) : null}
    </div>
  );
};

export default RepeatRulePicker;
