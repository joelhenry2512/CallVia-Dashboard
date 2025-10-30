import axios from 'axios';

const RETELL_API_URL = 'https://api.retellai.com/v1';

// Initialize Retell client
const retellClient = axios.create({
  baseURL: RETELL_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Create a phone call
export async function createCall(
  phoneNumber: string,
  agentId: string,
  metadata?: Record<string, any>
) {
  try {
    const response = await retellClient.post('/create-phone-call', {
      from_number: process.env.RETELL_PHONE_NUMBER,
      to_number: phoneNumber,
      agent_id: agentId,
      metadata,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Retell call:', error);
    throw error;
  }
}

// Get call details
export async function getCall(callId: string) {
  try {
    const response = await retellClient.get(`/get-call/${callId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting Retell call:', error);
    throw error;
  }
}

// List calls
export async function listCalls(limit = 100) {
  try {
    const response = await retellClient.get('/list-calls', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error listing Retell calls:', error);
    throw error;
  }
}
