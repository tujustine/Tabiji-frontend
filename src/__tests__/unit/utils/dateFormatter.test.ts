import { formatDate } from '@/utils/dateFormatter';

describe('dateFormatter', () => {
  describe('formatDate', () => {
    it('should format a valid ISO date string', () => {
      const dateString = '2025-01-15T10:30:00Z';
      const formatted = formatDate(dateString);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
      // Le format exact dépend de la locale, mais devrait contenir la date
      expect(formatted).toMatch(/15/);
    });

    it('should return original string for invalid date', () => {
      const invalidDate = 'invalid-date';
      const result = formatDate(invalidDate);
      expect(result).toBe(invalidDate);
    });

    it('should handle different date formats', () => {
      const date1 = '2025-12-25';
      const date2 = '2025-01-01T00:00:00.000Z';
      
      const formatted1 = formatDate(date1);
      const formatted2 = formatDate(date2);
      
      expect(formatted1).toBeTruthy();
      expect(formatted2).toBeTruthy();
    });
  });
});
