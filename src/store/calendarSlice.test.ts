import reducer, {
  goToThisWeek,
  nextWeek,
  previousWeek,
  setWeekStart,
} from './calendarSlice';

describe('calendarSlice', () => {
  it('moves by whole weeks', () => {
    const start = { weekStart: '2026-09-22' };
    expect(reducer(start, nextWeek()).weekStart).toBe('2026-09-29');
    expect(reducer(start, previousWeek()).weekStart).toBe('2026-09-15');
  });

  it('jumps to a given week', () => {
    expect(
      reducer({ weekStart: '2026-01-01' }, goToThisWeek('2026-09-22'))
        .weekStart,
    ).toBe('2026-09-22');
    expect(
      reducer({ weekStart: '2026-01-01' }, setWeekStart('2026-10-05'))
        .weekStart,
    ).toBe('2026-10-05');
  });
});
