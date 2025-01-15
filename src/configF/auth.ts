require('dotenv').config();

module.exports = {
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d'
    },
    facebook: {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: '/auth/facebook/callback',
        profileFields: ['id', 'emails', 'name']
    },
    google: {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback'
    },
    apple: {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        callbackURL: '/auth/apple/callback',
        keyID: process.env.APPLE_KEY_ID,
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION
    },
    redirects: {
        webApp: process.env.WEB_APP_URL,
        mobileApp: process.env.MOBILE_APP_SCHEME
    }
};