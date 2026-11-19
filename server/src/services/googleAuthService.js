const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    fullName: payload.name,
    avatar: payload.picture,
    phone: null,
    emailVerified: payload.email_verified,
  };
}

async function verifyGoogleAccessToken(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Failed to verify Google access token');
  }
  const payload = await res.json();

  let phone = null;
  // Attempt to read phone number via Google People API if scope was granted
  try {
    const peopleRes = await fetch(
      'https://people.googleapis.com/v1/people/me?personFields=phoneNumbers',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (peopleRes.ok) {
      const peopleData = await peopleRes.json();
      if (Array.isArray(peopleData.phoneNumbers) && peopleData.phoneNumbers.length > 0) {
        phone = peopleData.phoneNumbers[0].value || peopleData.phoneNumbers[0].canonicalForm;
      }
    }
  } catch (err) {
    console.warn('Google People API phone read skipped or unavailable:', err.message);
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    fullName: payload.name,
    avatar: payload.picture,
    phone,
    emailVerified: payload.email_verified !== false,
  };
}

module.exports = {
  verifyGoogleToken,
  verifyGoogleAccessToken,
};
