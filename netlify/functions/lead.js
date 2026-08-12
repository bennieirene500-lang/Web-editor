const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ERESPONDER_API_KEY = process.env.ERESPONDER_API_KEY;
const ERESPONDER_CAMPAIGN_ID = process.env.ERESPONDER_CAMPAIGN_ID;

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Method not allowed' })
    };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ERESPONDER_API_KEY || !ERESPONDER_CAMPAIGN_ID) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        message: 'Missing Netlify environment variables.'
      })
    };
  }

  let payload;

  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Invalid JSON payload.' })
    };
  }

  const fullName = String(payload.full_name || '').trim();
  const email = String(payload.email || '').trim();
  const source = String(payload.source || 'ica-ai-video-editor');

  if (!fullName || !email) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Full name and email are required.' })
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Please provide a valid email address.' })
    };
  }

  const createdAt = new Date().toISOString();

  try {
    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        source,
        status: 'new',
        created_at: createdAt
      })
    });

    const supabaseText = await supabaseResponse.text();

    if (!supabaseResponse.ok) {
      throw new Error(`Supabase error: ${supabaseText}`);
    }

    const eResponderBody = new URLSearchParams({
      api_key: ERESPONDER_API_KEY,
      CampaignId: String(ERESPONDER_CAMPAIGN_ID),
      FullName: fullName,
      Email: email
    });

    const eResponderResponse = await fetch('https://gogvo.com/api/eresponder/add_subscriber', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: eResponderBody.toString()
    });

    const eResponderText = await eResponderResponse.text();

    if (!eResponderResponse.ok) {
      console.warn('Autoresponder error:', eResponderText);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, message: 'Lead captured successfully.' })
    };
  } catch (error) {
    console.error('Lead submission error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        message: 'We could not save your details right now. Please try again.'
      })
    };
  }
};
