import { makeOccurrenceKey, parseOccurrenceKey } from './occurrenceKey';

describe('occurrenceKey', () => {
  it('round-trips a task id and date', () => {
    const key = makeOccurrenceKey('abc-123', '2026-09-22');
    expect(key).toBe('abc-123:2026-09-22');
    expect(parseOccurrenceKey(key)).toEqual({
      taskId: 'abc-123',
      date: '2026-09-22',
    });
  });

  it('returns null for malformed keys', () => {
    expect(parseOccurrenceKey('nope')).toBeNull();
    expect(parseOccurrenceKey(':2026-09-22')).toBeNull();
    expect(parseOccurrenceKey('abc:')).toBeNull();
  });
});
