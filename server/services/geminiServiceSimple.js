import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Simple Gemini call to fetch REAL NFP data
export async function getRealNFPData() {
 console.log('🤖 Fetching REAL NFP data with Gemini...');
  
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'demo' || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `Today is March 7, 2026. Search the web for the most recent US Non-Farm Payrolls (NFP) employment data.

Find the LATEST NFP release from the Bureau of Labor Statistics (likely February 2026 data released in early March 2026):

1. ACTUAL value released (in thousands of jobs added/lost)
2. CONSENSUS FORECAST that analysts predicted BEFORE the release (from Trading Economics, Bloomberg, Reuters)
3. PREVIOUS month's value

Answer in this EXACT JSON format with REAL numbers:
{
  "actual": 256,
  "forecast": 200,
  "previous": 230
}

Search BLS.gov, Trading Economics, and financial news. Use REAL data only, no examples.`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📡 Gemini Response Status:', response.status);
    
    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const text = response.data.candidates[0].content.parts[0].text;
      console.log('✅ Gemini Response:', text.substring(0, 200));
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        console.log('✅ Parsed NFP Data:', data);
        return data;
      }
    }

    throw new Error('No valid response from Gemini');
  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}
