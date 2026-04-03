const axios = require('axios');

const generateHotelImage = async (hotelName, city) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      // Return a high-quality placeholder if no API key
      return `https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop`;
    }

    const prompt = `Luxurious hotel room interior at ${hotelName} in ${city}, professional travel photography, 8k resolution, elegant lighting`;
    
    const response = await axios.post('https://api.openai.com/v1/images/generations', {
      prompt,
      n: 1,
      size: '1024x1024'
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.data[0].url;
  } catch (error) {
    console.error('AI Image Generation error:', error.message);
    return null;
  }
};

module.exports = { generateHotelImage };
