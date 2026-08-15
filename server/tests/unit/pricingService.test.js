const { calculateBookingPrice, calculateNights, normalizeDate } = require('../../services/pricingService');

describe('Pricing & Date Calculation Service Unit Tests', () => {
  describe('normalizeDate', () => {
    it('should strip time component and set to midnight UTC', () => {
      const date = new Date('2026-08-20T15:30:45.123Z');
      const normalized = normalizeDate(date);
      expect(normalized.getUTCHours()).toBe(0);
      expect(normalized.getUTCMinutes()).toBe(0);
      expect(normalized.getUTCSeconds()).toBe(0);
      expect(normalized.getUTCMilliseconds()).toBe(0);
    });
  });

  describe('calculateNights', () => {
    it('should correctly calculate 1 night stay', () => {
      const nights = calculateNights('2026-08-20', '2026-08-21');
      expect(nights).toBe(1);
    });

    it('should correctly calculate 3 night stay', () => {
      const nights = calculateNights('2026-08-20', '2026-08-23');
      expect(nights).toBe(3);
    });

    it('should correctly calculate 30 night long stay', () => {
      const nights = calculateNights('2026-08-01', '2026-08-31');
      expect(nights).toBe(30);
    });

    it('should handle month boundary stay (Aug 30 to Sept 2)', () => {
      const nights = calculateNights('2026-08-30', '2026-09-02');
      expect(nights).toBe(3);
    });

    it('should handle year boundary stay (Dec 30 2026 to Jan 2 2027)', () => {
      const nights = calculateNights('2026-12-30', '2027-01-02');
      expect(nights).toBe(3);
    });

    it('should handle leap year boundary (Feb 28 2028 to Mar 1 2028)', () => {
      const nights = calculateNights('2028-02-28', '2028-03-01');
      expect(nights).toBe(2); // 2028 is a leap year (Feb 29 exists)
    });
  });

  describe('calculateBookingPrice', () => {
    it('should correctly compute price breakdown for ₹3,000/night for 3 nights, 1 room', () => {
      const pricePerNight = 3000;
      const checkIn = '2026-08-20';
      const checkOut = '2026-08-23';
      const roomsBooked = 1;

      const pricing = calculateBookingPrice(pricePerNight, checkIn, checkOut, roomsBooked);

      expect(pricing.pricePerNight).toBe(3000);
      expect(pricing.numberOfNights).toBe(3);
      expect(pricing.roomsBooked).toBe(1);
      expect(pricing.subtotal).toBe(9000); // 3000 * 3 * 1
      expect(pricing.taxes).toBe(1080); // 9000 * 0.12 = 1080
      expect(pricing.discount).toBe(0);
      expect(pricing.totalAmount).toBe(10080); // 9000 + 1080
    });

    it('should correctly compute price breakdown for multiple rooms (₹4,500/night, 2 nights, 2 rooms)', () => {
      const pricePerNight = 4500;
      const checkIn = '2026-09-10';
      const checkOut = '2026-09-12';
      const roomsBooked = 2;

      const pricing = calculateBookingPrice(pricePerNight, checkIn, checkOut, roomsBooked);

      expect(pricing.subtotal).toBe(18000); // 4500 * 2 nights * 2 rooms
      expect(pricing.taxes).toBe(2160); // 18000 * 0.12
      expect(pricing.totalAmount).toBe(20160); // 18000 + 2160
    });
  });
});
