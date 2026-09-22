import {
  type PlannerDocument,
  emptyDocument,
} from '../shared/models/PlannerDocument';
import type { DateKey, Task } from '../shared/models/Task';
import { addDaysToKey } from '../shared/utils/date';
import { makeOccurrenceKey } from '../shared/utils/occurrenceKey';

const at = (today: DateKey, offset: number, hour: number) =>
  new Date(
    `${addDaysToKey(today, offset)}T${String(hour).padStart(2, '0')}:00:00.000Z`,
  ).toISOString();

/** Deterministic sample data for `npm run dev:mock` and tests, relative to `today`. */
const createSeedDocument = (today: DateKey): PlannerDocument => {
  const stamp = (offset: number, hour: number) => at(today, offset, hour);

  const tasks: Task[] = [
    {
      id: 'seed-client-meeting',
      title: 'Client meeting',
      startDate: today,
      time: '13:00',
      repeat: { kind: 'none' },
      endDate: null,
      subItems: [
        { id: 'seed-client-meeting-1', text: 'Proposal recruitment' },
        { id: 'seed-client-meeting-2', text: 'Plan A and Plan B' },
      ],
      createdAt: stamp(-3, 9),
      updatedAt: stamp(-3, 9),
    },
    {
      id: 'seed-read-book',
      title: 'Read book',
      startDate: today,
      time: '15:00',
      repeat: { kind: 'none' },
      endDate: null,
      subItems: [
        { id: 'seed-read-book-1', text: 'Chapter 4' },
        { id: 'seed-read-book-2', text: 'Take notes' },
      ],
      createdAt: stamp(-3, 10),
      updatedAt: stamp(-3, 10),
    },
    {
      id: 'seed-room-clean',
      title: 'Room clean',
      startDate: today,
      time: '19:00',
      repeat: { kind: 'none' },
      endDate: null,
      subItems: [],
      createdAt: stamp(-2, 8),
      updatedAt: stamp(-2, 8),
    },
    {
      id: 'seed-kitten-food',
      title: 'Buy kitten food',
      startDate: today,
      time: null,
      repeat: { kind: 'none' },
      endDate: null,
      subItems: [],
      createdAt: stamp(-1, 8),
      updatedAt: stamp(-1, 8),
    },
    {
      id: 'seed-brush-teeth',
      title: 'Brush your teeth',
      startDate: addDaysToKey(today, -10),
      time: '08:00',
      repeat: { kind: 'daily' },
      endDate: null,
      subItems: [],
      createdAt: stamp(-10, 7),
      updatedAt: stamp(-10, 7),
    },
    {
      id: 'seed-gym',
      title: 'Gym',
      startDate: addDaysToKey(today, -7),
      time: '18:00',
      repeat: { kind: 'weekly', days: [1, 4] },
      endDate: null,
      subItems: [],
      createdAt: stamp(-7, 7),
      updatedAt: stamp(-7, 7),
    },
    {
      id: 'seed-paper-review',
      title: 'Paper review',
      startDate: addDaysToKey(today, 2),
      time: '09:00',
      repeat: { kind: 'none' },
      endDate: null,
      subItems: [
        { id: 'seed-paper-review-1', text: 'Read abstract' },
        { id: 'seed-paper-review-2', text: 'Check methods' },
        { id: 'seed-paper-review-3', text: 'Write summary' },
      ],
      createdAt: stamp(-1, 9),
      updatedAt: stamp(-1, 9),
    },
    {
      id: 'seed-family-lunch',
      title: 'Family lunch',
      startDate: addDaysToKey(today, 4),
      time: null,
      repeat: { kind: 'none' },
      endDate: null,
      subItems: [],
      createdAt: stamp(-1, 10),
      updatedAt: stamp(-1, 10),
    },
    {
      id: 'seed-yesterday',
      title: 'Return library books',
      startDate: addDaysToKey(today, -1),
      time: '10:00',
      repeat: { kind: 'none' },
      endDate: null,
      subItems: [],
      createdAt: stamp(-4, 9),
      updatedAt: stamp(-4, 9),
    },
  ];

  return {
    ...emptyDocument(),
    tasks,
    occurrenceStates: {
      [makeOccurrenceKey('seed-client-meeting', today)]: {
        done: true,
        doneSubItemIds: [],
      },
    },
  };
};

export { createSeedDocument };
