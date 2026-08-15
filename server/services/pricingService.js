// Helper function to normalize dates to midnight UTC/server time to prevent timezone shift issues
const normalizeDate = (dateStringOrObject) => {
  const d = new Date(dateStringOrObject);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Pure server-side pricing engine
const calculateBookingPrice = (pricePerNight, checkInInput, checkOutInput, roomsBooked = 1) => {
  const checkIn = normalizeDate(checkInInput);
  const checkOut = normalizeDate(checkOutInput);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new Error('Invalid check-in or check-out date format');
  }

  if (checkOut <= checkIn) {
    throw new Error('Check-out date must be strictly after check-in date');
  }

  const diffTime = Math.abs(checkOut - checkIn);
  const numberOfNights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const validRoomsBooked = Math.max(1, Number(roomsBooked) || 1);
  const subtotal = Math.round(pricePerNight * numberOfNights * validRoomsBooked);
  
  // Standard 12% Hospitality Tax
  const taxes = Math.round(subtotal * 0.12);
  const discount = 0;
  const totalAmount = subtotal + taxes - discount;

  return {
    pricePerNight,
    numberOfNights,
    roomsBooked: validRoomsBooked,
    subtotal,
    taxes,
    discount,
    totalAmount,
    currency: 'INR',
    checkIn,
    checkOut,
  };
};

module.exports = {
  normalizeDate,
  calculateBookingPrice,
};
