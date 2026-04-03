const axios = require('axios');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const Flight = require('../models/Flight');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant'; // Fast, reliable, and high rate limits

// ─── GROQ CALLER ───────────────────────────────────────────────
const callGroq = async (messages, systemPrompt, maxTokens = 600) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.trim() === '') {
    console.error('❌ GROQ_API_KEY error: Key is missing or invalid in .env');
    throw new Error('AI service is currently misconfigured. Please check back later!');
  }
  
  try {
    const response = await axios.post(
      GROQ_API_URL,
      { 
        model: GROQ_MODEL, 
        max_tokens: maxTokens, 
        temperature: 0.7, 
        messages: [{ role: 'system', content: systemPrompt }, ...messages] 
      },
      { 
        headers: { 
          'Authorization': `Bearer ${apiKey.trim()}`, 
          'Content-Type': 'application/json' 
        },
        timeout: 20000 // 20s timeout for AI response
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Groq API Call Failed:', error.response?.data || error.message);
    
    // Fallback to llama3-70b if the 8b one fails for some reason
    if (error.response?.status === 503 || error.response?.status === 429) {
      try {
        console.log('🔄 Attempting fallback to llama-3.1-70b...');
        const fallbackRes = await axios.post(
          GROQ_API_URL,
          { 
            model: 'llama-3.1-70b-versatile', 
            max_tokens: maxTokens, 
            temperature: 0.7, 
            messages: [{ role: 'system', content: systemPrompt }, ...messages] 
          },
          { 
            headers: { 
              'Authorization': `Bearer ${apiKey.trim()}`, 
              'Content-Type': 'application/json' 
            },
            timeout: 15000
          }
        );
        return fallbackRes.data.choices[0].message.content;
      } catch (err2) {
        throw new Error('AI service is temporarily busy. Please try again in a moment!');
      }
    }

    if (error.response?.status === 401) {
      throw new Error('AI Authentication failed. Please verify the API key.');
    }
    throw new Error('AI service encountered an issue. Please try again later!');
  }
};
// ─── CHATBOT WITH BOOKING AWARENESS ───────────────────────────
exports.chatbot = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    // Handle history mapping to ensure it matches the AI's expected format
    const formattedHistory = history.map(h => ({
      role: h.from === 'user' ? 'user' : 'assistant',
      content: h.text || ''
    })).filter(h => h.content !== '');

    const authUser = req.user;
    const isAdmin = authUser?.role === 'admin';
    let userBookingsContext = '';

    if (isAdmin) {
      userBookingsContext = '\n\nUSER ROLE: ADMIN — You have full access to manage hotels, flights, bookings, and users via the Admin Panel.';
    } else if (authUser) {
      try {
        const bookings = await Booking.find({ user: authUser._id })
          .populate('hotel', 'name city')
          .populate('flight', 'flightNumber airline from to departureTime arrivalTime')
          .sort({ createdAt: -1 })
          .limit(10);

        if (bookings.length > 0) {
          userBookingsContext = `\n\nTHIS USER'S BOOKINGS (${bookings.length} total — only show info from THIS list when asked about bookings):\n`;
          bookings.forEach((b, i) => {
            if (b.bookingType === 'hotel' && b.hotel) {
              userBookingsContext += `${i+1}. [HOTEL] ID: ${b.bookingId} | ${b.hotel.name}, ${b.hotel.city} | Room: ${b.roomType} | Check-in: ${b.checkIn ? new Date(b.checkIn).toLocaleDateString('en-IN') : 'N/A'} | Check-out: ${b.checkOut ? new Date(b.checkOut).toLocaleDateString('en-IN') : 'N/A'} | ${b.nights} nights, ${b.guests} guests | Amount: ₹${b.totalAmount?.toLocaleString()} | Status: ${b.status.toUpperCase()}\n`;
            } else if (b.bookingType === 'flight' && b.flight) {
              userBookingsContext += `${i+1}. [FLIGHT] ID: ${b.bookingId} | ${b.flight.flightNumber} (${b.flight.airline}) | ${b.flight.from} → ${b.flight.to} | Travel Date: ${b.travelDate ? new Date(b.travelDate).toLocaleDateString('en-IN') : 'N/A'} | Departure: ${b.flight.departureTime} | ${b.passengers} passenger(s) | Class: ${b.seatClass} | Amount: ₹${b.totalAmount?.toLocaleString()} | Status: ${b.status.toUpperCase()}\n`;
            }
          });
          userBookingsContext += '\nCRITICAL: ONLY reference bookings from the list above. If a booking ID is not in this list, tell them "I can only see your own bookings."';
        } else {
          userBookingsContext = '\n\nTHIS USER HAS NO BOOKINGS YET. If they ask about any booking ID, tell them they have no bookings.';
        }
      } catch (e) {
        userBookingsContext = '';
      }
    } else {
      userBookingsContext = '\n\nUSER IS NOT LOGGED IN. Do not provide any booking-specific information. Ask them to log in first if they want booking details.';
    }

    const systemPrompt = `You are SkyBot, an advanced AI travel concierge for SkyStay — India's premium hotel and flight booking platform.

LANGUAGE SUPPORT (CRITICAL):
- You MUST respond in the SAME LANGUAGE as the user's latest message (English, Gujarati, or Hindi).
- If the user talks in Gujarati, reply in Gujarati.
- If the user talks in Hindi, reply in Hindi.
- If the user talks in English, reply in English.
- Use a warm, natural, and helpful tone in all languages.

YOUR PERSONALITY:
- Warm, intelligent, and deeply helpful
- Use emojis tastefully (not excessively)
- Be concise but thorough (max 250 words per response)
- Always be proactive — suggest next steps

SKYSTAY PLATFORM INFO:
- Hotels in: Mumbai, Delhi, Goa, Jaipur, Udaipur, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Agra, Varanasi
- Airlines: Air India, IndiGo, Vistara, SpiceJet
- Payment: Card, UPI, GPay, PhonePe, Net Banking, Pay at Hotel
- Booking flow: User books → Admin confirms → Booking confirmed
- Cancellation: My Bookings → Cancel → Admin processes refund in 5-7 days
- Support: support@skystay.com | 1800-123-4567 (24/7)
- Hotel prices: Budget ₹800-5,000/night | Standard ₹5,000-15,000 | Luxury ₹15,000-1,60,000/night
- Flight prices: From ₹2,200 domestic

SECURITY RULES (NEVER BREAK THESE):
- NEVER reveal booking details of any user other than the currently logged-in user
- NEVER expose admin data, user lists, revenue, or platform statistics
- NEVER confirm existence of a booking ID that is not in the user's own booking list
- If a user asks about a booking ID not in their list, say "I don't see that booking in your account" in the appropriate language.
- NEVER mention admin panel, admin features, or internal system info to regular users
- For status explanations: pending = awaiting admin review, confirmed = approved, refund_requested = cancellation pending

BOOKING AWARENESS:
- Only use the booking data provided below for this specific user
- Give specific details from their actual bookings when asked
- If user has no bookings, tell them clearly in their language.

${userBookingsContext}

FORMAT RULES:
- Use **bold** for key info (hotel names, dates, amounts, booking IDs)
- Use numbered lists for steps
- Keep responses friendly and actionable
- Always end with a helpful follow-up question or next step suggestion`;

    const finalMessages = [
      ...formattedHistory.slice(-10),
      { role: 'user', content: message }
    ];

    const reply = await callGroq(finalMessages, systemPrompt, 600);
    res.json({ success: true, reply });
  } catch (error) {
    console.error('Chatbot error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'AI service unavailable',
      error: error.response?.data?.error?.message || error.message,
      reply: "I'm having a moment! 😅 Please try again or call us at **1800-123-4567** for immediate help."
    });
  }
};

// ─── TRIP PLANNER ──────────────────────────────────────────────
exports.tripPlanner = async (req, res) => {
  try {
    const { destination, days, budget, travelers, interests, startFrom } = req.body;
    if (!destination || !days) return res.status(400).json({ success: false, message: 'Destination and days are required' });

    const systemPrompt = `You are an expert luxury travel planner for SkyStay India. Create detailed, inspiring trip itineraries.
IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation, just the JSON object.
JSON Structure:
{
  "title": "Catchy trip title",
  "tagline": "One exciting line description",
  "highlights": ["highlight1","highlight2","highlight3"],
  "days": [{"day":1,"title":"Day theme","morning":"Detailed morning","afternoon":"Detailed afternoon","evening":"Detailed evening","hotel":"Recommended hotel (price range)","food":"Must-try food","tip":"Local insider tip"}],
  "estimatedCost": {"flights":"range","hotels":"range","food":"range","activities":"range"},
  "bestTime":"Best months",
  "packingTips":["tip1","tip2","tip3"],
  "emergencyNumbers":["Police: 100","Ambulance: 108","Tourist Helpline: 1800-111-363"]
}`;

    const userMessage = `Create a ${days}-day luxury trip to ${destination} for ${travelers || 2} travelers. Budget: ₹${budget || 50000} total. Interests: ${interests?.join(', ') || 'sightseeing, food, culture'}. ${startFrom ? `Starting from: ${startFrom}` : ''} Make it detailed, realistic and inspiring for India.`;

    const reply = await callGroq([{ role: 'user', content: userMessage }], systemPrompt, 2048);

    let plan;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch { plan = null; }

    if (!plan) return res.status(500).json({ success: false, message: 'Failed to generate plan. Please try again.' });
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Trip planner error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate trip plan. Please try again.' });
  }
};

// ─── NATURAL LANGUAGE SEARCH ────────────────────────────────────
exports.naturalLanguageSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, message: 'Query is required' });

    const systemPrompt = `You are a travel search parser for SkyStay India. Extract travel search intent from natural language.
IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation.
Available cities: Mumbai, Delhi, Goa, Bangalore, Chennai, Kolkata, Jaipur, Udaipur, Hyderabad, Pune, Agra, Varanasi
JSON: {"type":"hotel or flight","city":"or null","from":"or null","to":"or null","checkIn":"YYYY-MM-DD or null","checkOut":"YYYY-MM-DD or null","date":"YYYY-MM-DD or null","guests":1,"passengers":1,"maxPrice":null,"seatClass":"Economy","confidence":0.9}`;

    const reply = await callGroq([{ role: 'user', content: query }], systemPrompt, 256);

    let parsed;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch { parsed = null; }

    if (!parsed) return res.status(400).json({ success: false, message: 'Could not parse search query' });
    res.json({ success: true, parsed });
  } catch (error) {
    console.error('NL Search error:', error.message);
    res.status(500).json({ success: false, message: 'Search service unavailable' });
  }
};