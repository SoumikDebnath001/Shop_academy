import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

import UserController from '../controllers/auth/user';
import { User } from '@repo/database';

dotenv.config();

const router = express.Router();

const loginFailedUrl = `${process.env.FRONTEND_URL}/auth?error=google_auth_failed`;

// Configure Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:2556/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      // Find or create user in MongoDB
      UserController.googleLogin(profile)
        .then((result: any) => done(null, result || false))
        .catch((error: any) => done(error));
    }
  )
);

// We need to serialize and deserialize user for passport even if we use JWT later,
// because passport-google-oauth20 might use session temporarily during the flow
passport.serializeUser((result: any, done) => {
  done(null, result.user._id.toString());
});

passport.deserializeUser((id: string, done) => {
  User.findById(id)
    .then((user) => done(null, user || null))
    .catch((error) => done(error));
});

// 1. Initiate Google Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Google Callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (error: any, result: any) => {
    if (error || !result) {
      if (error) console.log("Google Login Error:", error);
      return res.redirect(loginFailedUrl);
    }

    // Set HttpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // For cross-origin if frontend is on different port
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend dashboard or home
    res.redirect(`${process.env.FRONTEND_URL}/`);
  })(req, res, next);
});

// 3. Get Current User Route
router.get('/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ isAuthenticated: false });
  }

  const user = await UserController.getTokenData(token);
  if (!user) {
    return res.status(401).json({ isAuthenticated: false });
  }

  return res.status(200).json({ isAuthenticated: true, user: UserController.toAuthUser(user) });
});

// 4. Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
