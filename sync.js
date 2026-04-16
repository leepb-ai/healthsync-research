// netlify/functions/sync.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // 1. Get the secret keys from the Netlify Environment
  const { AIRTABLE_PAT, BASE_ID } = process.env;
  
  // 2. Parse the data sent from your survey
  const body = JSON.parse(event.body);

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};