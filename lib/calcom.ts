import axios from 'axios';

const CALCOM_API_URL = 'https://api.cal.com/v1';

// Initialize Cal.com client
const calcomClient = axios.create({
  baseURL: CALCOM_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.CALCOM_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Get availability
export async function getAvailability(
  eventTypeId: number,
  startTime: string,
  endTime: string
) {
  try {
    const response = await calcomClient.get('/availability', {
      params: {
        eventTypeId,
        startTime,
        endTime,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting Cal.com availability:', error);
    throw error;
  }
}

// Create a booking
export async function createBooking(
  eventTypeId: number,
  start: string,
  responses: Record<string, any>
) {
  try {
    const response = await calcomClient.post('/bookings', {
      eventTypeId,
      start,
      responses,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Cal.com booking:', error);
    throw error;
  }
}

// Cancel a booking
export async function cancelBooking(bookingId: number, reason?: string) {
  try {
    const response = await calcomClient.delete(`/bookings/${bookingId}`, {
      data: { reason },
    });
    return response.data;
  } catch (error) {
    console.error('Error canceling Cal.com booking:', error);
    throw error;
  }
}

// Reschedule a booking
export async function rescheduleBooking(
  bookingId: number,
  start: string,
  reason?: string
) {
  try {
    const response = await calcomClient.patch(`/bookings/${bookingId}`, {
      start,
      reason,
    });
    return response.data;
  } catch (error) {
    console.error('Error rescheduling Cal.com booking:', error);
    throw error;
  }
}
