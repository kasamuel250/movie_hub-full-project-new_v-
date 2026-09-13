const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const dns = require('dns');
require('dotenv').config();

// Use public DNS resolvers so Atlas SRV records resolve even when the local
// network DNS server fails to answer queries for cluster0.ykmjeum.mongodb.net.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const User = require('./models/User');
const Watchlist = require('./models/Watchlist');
const WatchHistory = require('./models/WatchHistory');
const Favorite = require('./models/Favorite');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const SupportRequest = require('./models/SupportRequest');
const SongPlaylist = require('./models/SongPlaylist');
const Visit = require('./models/Visit');
const MusicPlay = require('./models/MusicPlay');
const { getEnrichedMovieData } = require('./movieService');

// MTN Mobile Money (Momo) configuration — production-ready gateway.
const MOMO_SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY || '5c0b336a-ae31-11f1-80f3-deadd43720af';
const MOMO_API_USER = process.env.MOMO_API_USER || 'f3b42c68-ae3f-11f1-b15d-deadd43720af';
const MOMO_API_KEY = process.env.MOMO_API_KEY || 'd4c10fc790791900df3cc3313f60f781da39a3ee5e6b4b0d3255bfef95601890afd80709';
const MOMO_ENV = process.env.MOMO_ENV || 'sandbox';
const MOMO_COLLECTION_BASE = process.env.MOMO_COLLECTION_BASE || 'https://sandbox.momodeveloper.mtn.com/collection';
const MOMO_OPERATOR = process.env.MOMO_OPERATOR || 'MTN';
const MOMO_CURRENCY = process.env.MOMO_CURRENCY || 'RWF';
const MOMO_PAYEE_MSISDN = process.env.MOMO_PAYEE_MSISDN || '0782175566';
const MOMO_PAYEE_NAME = process.env.MOMO_PAYEE_NAME || 'Ka_samuel@250 Filmz';

const app = express();
app.use(express.json());
app.use(cookieParser());
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5174'];
const extraOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean) : [];
const allowedOrigins = [...new Set([...devOrigins, ...extraOrigins, CLIENT_URL.replace(/\/+$/, '')].filter(Boolean))];
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true
}));

const PORT = process.env.PORT || 5000;
const TMDB_URL = 'https://api.themoviedb.org/3';
const JWT_SECRET = process.env.JWT_SECRET || 'filmz-super-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/filmz';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kasamuel71@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tetaornella@250';

const DEV_MODE = process.env.DEV_MODE !== 'false';
const FREE_TRIAL_DAYS = process.env.FREE_TRIAL_DAYS || 365;
const PREMIUM_PRICE = parseFloat(process.env.PREMIUM_PRICE || '4000');

// Nodemailer transporter - uses Gmail SMTP by default
const createTransporter = () => {
  if (process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_16_char_app_password') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'kasamuel71@gmail.com',
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return null;
};

const sendResetEmail = async (email, resetLink) => {
  if (DEV_MODE) {
    console.log(`\n=== PASSWORD RESET LINK (DEV MODE) ===`);
    console.log(`To: ${email}`);
    console.log(`Link: ${resetLink}`);
    console.log(`=====================================\n`);
    return true;
  }
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('Email not configured. Reset link would be:', resetLink);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"Ka_samuel@250 Filmz" <${process.env.EMAIL_USER || 'noreply@filmz.app'}>`,
      to: email,
      subject: 'Password Reset - Ka_samuel@250 Filmz',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0b1e; color: #e0e0e0; padding: 30px; border-radius: 16px;">
          <h1 style="color: #00ccff; text-align: center;">Ka_samuel@250 Filmz</h1>
          <p style="font-size: 16px; text-align: center;">You requested a password reset.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #00ccff, #00ff88); color: #001018; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="text-align: center; color: #888; font-size: 13px;">This link expires in 1 hour.</p>
          <p style="text-align: center; color: #888; font-size: 13px;">If you didn't request this, ignore this email.</p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error.message);
    console.warn('Fallback - reset link:', resetLink);
    return false;
  }
};

// In-memory fallback store for when MongoDB is not available
const memStore = {
  users: [],
  comments: [],
  watchlists: [],
  watchHistories: [],
  favorites: [],
  notifications: [],
  supportRequests: [],
  songPlaylists: [],
  visits: [],
  musicPlays: [],
  settings: null,
  nextId: { user: 1, comment: 1, watchlist: 1, history: 1, favorite: 1, notification: 1, support: 1, songPlaylist: 1, visit: 1, musicPlay: 1 }
};

// Site-wide settings (footer content + subscription rules), editable by admin
const DEFAULT_SETTINGS = {
  siteName: 'FILMZ',
  siteTagline: 'The Galaxy of Movies & Series',
  siteDescription: 'Explore the galaxy of movies and series in an immersive space-themed experience.',
  footerAbout: '',
  footerText: 'Ka_samuel@250 Filmz - your galaxy of movies. All rights reserved.',
  adminEmail: 'kasamuel71@gmail.com',
  instagram: 'ka__samuel250',
  whatsapp: '0782175566',
  phone: '+250 787 949 343',
  email: 'kasamuel71@gmail.com',
  freeTrialDays: 365,
  subscriptionPrice: 4000,
  subscriptionCurrency: 'RWF',
  features: ['Movie Trailers', 'User Profiles', 'Watchlists', 'AI Assistant'],
  // Theme control — the admin picks the site-wide theme shown to all users
  siteTheme: 'default',
  availableThemes: [
    { id: 'default', name: 'Galaxy Blue', primary: '#00ccff', accent: '#ff0044', accent2: '#00ff88' },
    { id: 'dark', name: 'Deep Space', primary: '#4a90e2', accent: '#e74c3c', accent2: '#2ecc71' },
    { id: 'neon', name: 'Neon Cyber', primary: '#00ff88', accent: '#ff0080', accent2: '#00ccff' },
    { id: 'retro', name: 'Retro Sci-Fi', primary: '#ff6b35', accent: '#f7931e', accent2: '#ffd166' },
    { id: 'sunset', name: 'Sunset Drive', primary: '#ff9a3c', accent: '#ff5770', accent2: '#ffd76f' },
    { id: 'emerald', name: 'Emerald Forest', primary: '#34d399', accent: '#16a34a', accent2: '#a7f3d0' },
    { id: 'royal', name: 'Royal Purple', primary: '#a78bfa', accent: '#7c3aed', accent2: '#f0abfc' },
    { id: 'crimson', name: 'Crimson Eclipse', primary: '#ff4757', accent: '#cc0000', accent2: '#ffb8b8' },
    { id: 'aurora', name: 'Aurora Borealis', primary: '#22d3ee', accent: '#a78bfa', accent2: '#67e8f9' },
    { id: 'gold', name: 'Golden Hour', primary: '#fbbf24', accent: '#f59e0b', accent2: '#fde68a' },
    { id: 'cyber', name: 'Cyber Yellow', primary: '#facc15', accent: '#f97316', accent2: '#22d3ee' },
    { id: 'sakura', name: 'Sakura Blossom', primary: '#ff9ecb', accent: '#ff5d8f', accent2: '#ffd1e8' }
  ]
};

let dbReady = false;

// Seed in-memory admin IMMEDIATELY so login works before MongoDB connects/timeout
(() => {
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  memStore.users.push({
    _id: String(memStore.nextId.user++),
    email: ADMIN_EMAIL,
    passwordHash,
    name: 'Ka_samuel@250 Admin',
    username: 'ka__samuel250',
    phone: process.env.ADMIN_PHONE || '+250 787 949 343',
    location: 'Kigali, Rwanda',
    bio: 'Admin of the Filmz galaxy',
    avatar: null,
    role: 'admin',
    active: true,
    resetToken: null,
    resetTokenExpiry: null,
    notificationsEnabled: true,
    subscriptionTier: 'premium',
    subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    paymentMethod: { provider: '', number: '', name: '' },
    createdAt: new Date()
  });
  console.log('In-memory users seeded (admin)');
})();

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000
}).then(async () => {
  console.log('MongoDB connected');
  dbReady = true;
  // Check if admin already exists in MongoDB (might have been created earlier)
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    await User.create({
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'Ka_samuel@250 Admin',
      username: 'ka__samuel250',
      role: 'admin',
      active: true,
      location: 'Kigali, Rwanda',
      bio: 'Admin of the Filmz galaxy',
      subscriptionTier: 'premium',
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
    console.log('Admin user created in MongoDB');
  } else {
    await User.updateOne({ email: ADMIN_EMAIL }, { $set: { role: 'admin', username: 'ka__samuel250', active: true } });
  }
  console.log('MongoDB is active — in-memory store will not be used for new data');
}).catch((err) => {
  console.error('MongoDB not available, using in-memory store');
  console.error('MongoDB error:', err.message);
});

const isDbConnected = () => mongoose.connection.readyState === 1 && dbReady;

const getUserFromToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const isAdminUser = (decoded) => decoded?.role === 'admin' || decoded?.email === ADMIN_EMAIL || decoded?.username === 'ka__samuel250';

const requireAdmin = (req, res) => {
  const token = req.cookies?.token || (req.headers?.authorization ? req.headers.authorization.split(' ')[1] : null);
  const decoded = getUserFromToken(token);
  if (!decoded || !isAdminUser(decoded)) {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return decoded;
};

const findMemUser = (field, value) => memStore.users.find(u => u[field]?.toString() === value?.toString());

const toPublicUser = (u) => ({
  id: u._id,
  email: u.email,
  username: u.username || '',
  phone: u.phone || '',
  location: u.location || '',
  name: u.name || '',
  avatar: u.avatar || null,
  role: u.role,
  notificationsEnabled: u.notificationsEnabled !== false,
  subscriptionTier: u.subscriptionTier || 'free',
  subscriptionExpiry: u.subscriptionExpiry || null,
  trialEndsAt: u.trialEndsAt || null,
  paymentMethod: u.paymentMethod || { provider: '', number: '', name: '' },
  active: u.active !== false,
  lifetimeFree: u.lifetimeFree === true,
  role: u.role || 'user',
  createdAt: u.createdAt
});

// === Site settings helpers (footer + site-wide rules), editable by admin ===
const getSettings = async () => {
  const defaults = { ...DEFAULT_SETTINGS, features: [...(DEFAULT_SETTINGS.features || [])] };
  try {
    if (isDbConnected()) {
      const SiteSettings = require('./models/SiteSettings');
      const doc = await SiteSettings.findOne();
      if (!doc) return defaults;
      return { ...defaults, ...doc.toObject().data };
    }
  } catch (e) { /* fall through to memory */ }
  return memStore.settings ? { ...DEFAULT_SETTINGS, ...memStore.settings, features: memStore.settings.features || [...DEFAULT_SETTINGS.features] } : defaults;
};

const saveSettings = async (patch) => {
  const current = await getSettings();
  const merged = { ...current, ...patch, features: patch.features || current.features || [] };
  try {
    if (isDbConnected()) {
      const SiteSettings = require('./models/SiteSettings');
      await SiteSettings.updateOne({}, { $set: { data: merged } }, { upsert: true });
    }
  } catch (e) { /* fall through to memory */ }
  memStore.settings = merged;
  return merged;
};

app.get('/api/settings/public', async (req, res) => {
  try {
    const s = await getSettings();
    res.json({
      siteName: s.siteName || 'FILMZ',
      siteTagline: s.siteTagline || '',
      siteDescription: s.siteDescription || '',
      footerText: s.footerText || '',
      footerAbout: s.footerAbout || '',
      instagram: s.instagram || 'ka__samuel250',
      whatsapp: s.whatsapp || '',
      phone: s.phone || '',
      email: s.email || '',
      features: s.features || [],
      siteTheme: s.siteTheme || 'default',
      availableThemes: s.availableThemes || []
    });
  } catch (e) {
    res.status(500).json({ error: 'Could not load site settings' });
  }
});

app.get('/api/trending/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const page = req.query.page || 1;
        const response = await axios.get(`${TMDB_URL}/trending/${type}/day`, {
            params: { api_key: process.env.TMDB_KEY, page }
        });
        res.set('Cache-Control', 'public, max-age=3600');
        res.json(response.data);
    } catch (error) {
        console.error('TMDB API Error:', error.message);
        res.status(500).json({ error: 'Failed to connect to TMDB' });
    }
});

app.get('/api/movie/:id', async (req, res) => {
    try {
        const data = await getEnrichedMovieData(req.params.id);
        res.json(data);
    } catch (error) {
        console.error('Enrichment Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch enriched movie data' });
    }
});

app.get('/api/trailer/:title', async (req, res) => {
    try {
        const { title } = req.params;
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: `${title} official trailer`,
                key: process.env.YOUTUBE_KEY,
                maxResults: 1,
                type: 'video'
            }
        });
        const videoId = response.data.items[0]?.id?.videoId || null;
        res.json({ videoId });
    } catch (error) {
        console.error('YouTube API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch trailer from YouTube' });
    }
});

app.get('/api/comments/:movieId', async (req, res) => {
  try {
    if (isDbConnected()) {
      const movieComments = await Comment.find({ movieId: req.params.movieId }).sort({ createdAt: -1 }).lean();
      return res.json(movieComments.map(comment => ({
        id: comment._id, movieId: comment.movieId, userName: comment.userName,
        name: comment.userName, text: comment.text,
        date: new Date(comment.createdAt).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      })));
    }
    const movieComments = memStore.comments.filter(c => c.movieId === req.params.movieId).reverse();
    res.json(movieComments.map(c => ({
      id: c.id, movieId: c.movieId, userName: c.userName, name: c.userName, text: c.text, date: c.date
    })));
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json([]);
  }
});

app.post('/api/comments', async (req, res) => {
  const { movieId, userName, text } = req.body;
  if (!userName || !text || !movieId) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }
  try {
    if (isDbConnected()) {
      const result = await Comment.create({ movieId: String(movieId), userName, text });
      return res.json({
        id: result._id, movieId: result.movieId, userName: result.userName,
        name: result.userName, text: result.text,
        date: new Date(result.createdAt).toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      });
    }
    const newComment = {
      id: String(memStore.nextId.comment++), movieId: String(movieId), userName, text,
      date: new Date().toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    };
    memStore.comments.push(newComment);
    res.json(newComment);
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, username, phone, location, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }
  try {
    const trialEndsAt = new Date(Date.now() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000);
    if (isDbConnected()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) return res.status(400).json({ error: 'Email already registered' });
      const passwordHash = bcrypt.hashSync(password, 10);
      const newUser = await User.create({
        email: email.toLowerCase(), passwordHash,
        username: username || '', phone: phone || '', location: location || '',
        name: name || username || '', bio: '', role: 'user',
        notificationsEnabled: true, subscriptionTier: 'free', trialEndsAt
      });
      const token = jwt.sign({ id: newUser._id, email: newUser.email, username: newUser.username, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });
      return res.json({ user: toPublicUser(newUser), token });
    }
    if (findMemUser('email', email.toLowerCase())) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = {
      _id: String(memStore.nextId.user++), email: email.toLowerCase(), passwordHash,
      username: username || '', phone: phone || '', location: location || '',
      name: name || username || '', bio: '', avatar: null, role: 'user', active: true,
      notificationsEnabled: true, subscriptionTier: 'free',
      subscriptionExpiry: null, trialEndsAt,
      paymentMethod: { provider: '', number: '', name: '' },
      createdAt: new Date()
    };
    memStore.users.push(newUser);
    const token = jwt.sign({ id: newUser._id, email: newUser.email, username: newUser.username, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });
    res.json({ user: toPublicUser(newUser), token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const identifier = String(email || '').trim();
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email (or username) and password are required' });
  }
  try {
    let foundUser, passwordHash;
    const isEmail = identifier.includes('@');
    if (isDbConnected()) {
      foundUser = isEmail
        ? await User.findOne({ email: identifier.toLowerCase() })
        : await User.findOne().or([{ username: identifier }, { phone: identifier }]);
      if (!foundUser) return res.status(401).json({ error: 'Invalid credentials' });
      if (!bcrypt.compareSync(password, foundUser.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
    } else {
      foundUser = isEmail
        ? findMemUser('email', identifier.toLowerCase())
        : memStore.users.find(u => u.username === identifier || u.phone === identifier);
      if (!foundUser) return res.status(401).json({ error: 'Invalid credentials' });
      if (!bcrypt.compareSync(password, foundUser.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (foundUser.active === false) return res.status(403).json({ error: 'Account blocked. Contact support.' });
    const token = jwt.sign({
      id: foundUser._id,
      email: foundUser.email,
      username: foundUser.username,
      role: foundUser.role
    }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: toPublicUser(foundUser), token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    let user;
    if (isDbConnected()) {
      user = await User.findById(decoded.id);
    } else {
      user = findMemUser('_id', decoded.id);
    }
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (user.active === false) return res.status(403).json({ error: 'Account blocked. Contact support.' });
    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.json({ success: true });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const normalizedEmail = email.toLowerCase();
  let user;
  if (isDbConnected()) {
    user = await User.findOne({ email: normalizedEmail });
  } else {
    user = findMemUser('email', normalizedEmail);
  }

  // Always return the same message regardless of whether user exists (security best practice)
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  if (isDbConnected()) {
    await User.updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpiry } }
    );
  } else {
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
  }

  const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;
  const emailSent = await sendResetEmail(normalizedEmail, resetLink);
  const showLink = DEV_MODE || !emailSent;

  res.json({
    message: emailSent
      ? 'A reset link has been sent to your email.'
      : 'Your email service is not configured for sending, so the reset link is shown below.',
    devResetLink: showLink ? resetLink : undefined
  });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, email, newPassword } = req.body;
  if (!token || !email || !newPassword) {
    return res.status(400).json({ error: 'Token, email, and new password are required' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const normalizedEmail = email.toLowerCase();
  let user;
  if (isDbConnected()) {
    user = await User.findOne({ email: normalizedEmail, resetToken: token });
  } else {
    user = findMemUser('email', normalizedEmail);
    if (user && user.resetToken !== token) user = null;
  }

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired reset token.' });
  }

  const now = new Date();
  let expiry;
  if (isDbConnected()) {
    expiry = user.resetTokenExpiry;
  } else {
    expiry = user.resetTokenExpiry ? new Date(user.resetTokenExpiry) : null;
  }

  if (!expiry || expiry < now) {
    return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  if (isDbConnected()) {
    await User.updateOne(
      { _id: user._id },
      { $set: { passwordHash }, $unset: { resetToken: '', resetTokenExpiry: '' } }
    );
  } else {
    user.passwordHash = passwordHash;
    user.resetToken = null;
    user.resetTokenExpiry = null;
  }

  res.json({ success: true, message: 'Password has been reset successfully.' });
});

app.get('/api/profile', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const watchHistory = await WatchHistory.find({ user: user._id }).sort({ watchedAt: -1 }).lean();
      const watchlists = await Watchlist.find({ user: user._id }).lean();
      const favorites = await Favorite.find({ user: user._id }).lean();
      return res.json({
        profile: toPublicUser(user),
        watchHistory: watchHistory.map(h => ({ movieId: h.movieId, movieTitle: h.movieTitle, watchedAt: h.watchedAt })),
        watchlists: watchlists.map(w => ({ id: w._id, name: w.name, movies: w.movies || [] })),
        favorites: favorites.map(f => ({ movieId: f.movieId, movieTitle: f.movieTitle, posterPath: f.posterPath }))
      });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userHistory = memStore.watchHistories.filter(h => h.user === user._id).sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
    const userLists = memStore.watchlists.filter(w => w.user === user._id);
    const userFavs = memStore.favorites.filter(f => f.user === user._id);
    res.json({
      profile: toPublicUser(user),
      watchHistory: userHistory.map(h => ({ movieId: h.movieId, movieTitle: h.movieTitle, watchedAt: h.watchedAt })),
      watchlists: userLists.map(w => ({ id: w.id, name: w.name, movies: w.movies || [] })),
      favorites: userFavs.map(f => ({ movieId: f.movieId, movieTitle: f.movieTitle, posterPath: f.posterPath }))
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/profile', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  const fields = ['name', 'username', 'phone', 'location', 'bio', 'avatar', 'notificationsEnabled'];
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      fields.forEach(f => {
        if (req.body[f] !== undefined) user[f] = req.body[f];
      });
      await user.save();
      return res.json({ profile: toPublicUser(user) });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    fields.forEach(f => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });
    res.json({ profile: toPublicUser(user) });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.put('/api/profile/payment-method', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  const { provider, number, name } = req.body || {};
  if (!provider || !number) return res.status(400).json({ error: 'Provider and number are required' });
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.paymentMethod = { provider, number, name: name || '' };
      await user.save();
      return res.json({ paymentMethod: user.paymentMethod });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.paymentMethod = { provider, number, name: name || '' };
    res.json({ paymentMethod: user.paymentMethod });
  } catch (error) {
    console.error('Payment method update error:', error);
    res.status(500).json({ error: 'Failed to save payment method' });
  }
});

app.post('/api/watch-history', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  const { movieId, movieTitle } = req.body;
  if (!movieId) return res.status(400).json({ error: 'Movie ID required' });
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const existing = await WatchHistory.findOne({ user: user._id, movieId });
      if (!existing) await WatchHistory.create({ user: user._id, movieId, movieTitle: movieTitle || '', watchedAt: new Date() });
      return res.json({ success: true });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!memStore.watchHistories.some(h => h.user === user._id && h.movieId === movieId)) {
      memStore.watchHistories.push({ id: String(memStore.nextId.history++), user: user._id, movieId, movieTitle: movieTitle || '', watchedAt: new Date() });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Watch history error:', error);
    res.status(500).json({ error: 'Failed to save watch history' });
  }
});

app.get('/api/watch-history', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const watchHistory = await WatchHistory.find({ user: user._id }).sort({ watchedAt: -1 }).lean();
      return res.json({ watchHistory });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userHistory = memStore.watchHistories.filter(h => h.user === user._id).sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
    res.json({ watchHistory: userHistory });
  } catch (error) {
    console.error('Watch history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch watch history' });
  }
});

app.post('/api/watchlists', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'List name required' });
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const result = await Watchlist.create({ user: user._id, name, movies: [] });
      return res.json({ id: result._id, name: result.name, movies: result.movies || [] });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newList = { id: String(memStore.nextId.watchlist++), user: user._id, name, movies: [], createdAt: new Date() };
    memStore.watchlists.push(newList);
    res.json({ id: newList.id, name: newList.name, movies: newList.movies });
  } catch (error) {
    console.error('Watchlist creation error:', error);
    res.status(500).json({ error: 'Failed to create watchlist' });
  }
});

app.get('/api/watchlists', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const watchlists = await Watchlist.find({ user: user._id }).lean();
      return res.json({ watchlists: watchlists.map(w => ({ id: w._id, name: w.name, movies: w.movies || [] })) });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userLists = memStore.watchlists.filter(w => w.user === user._id);
    res.json({ watchlists: userLists.map(w => ({ id: w.id, name: w.name, movies: w.movies || [] })) });
  } catch (error) {
    console.error('Watchlists fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch watchlists' });
  }
});

app.post('/api/watchlists/:listId/items', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  const { listId } = req.params;
  const { movieId, movieTitle, posterPath } = req.body;
  if (!movieId) return res.status(400).json({ error: 'Movie ID required' });
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const watchlist = await Watchlist.findOne({ _id: listId, user: user._id });
      if (!watchlist) return res.status(404).json({ error: 'Watchlist not found' });
      if (!watchlist.movies.some(m => m.movieId === movieId)) {
        watchlist.movies.push({ movieId, movieTitle: movieTitle || '', posterPath: posterPath || '' });
        await watchlist.save();
      }
      return res.json({ watchlist });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const watchlist = memStore.watchlists.find(w => w.id === listId && w.user === user._id);
    if (!watchlist) return res.status(404).json({ error: 'Watchlist not found' });
    if (!watchlist.movies.some(m => m.movieId === movieId)) {
      watchlist.movies.push({ movieId, movieTitle: movieTitle || '', posterPath: posterPath || '', addedAt: new Date() });
    }
    res.json({ watchlist });
  } catch (error) {
    console.error('Watchlist update error:', error);
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

app.post('/api/favorites', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  const { movieId, movieTitle, posterPath } = req.body;
  if (!movieId) return res.status(400).json({ error: 'Movie ID required' });
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const existing = await Favorite.findOne({ user: user._id, movieId });
      if (!existing) await Favorite.create({ user: user._id, movieId, movieTitle: movieTitle || '', posterPath: posterPath || '' });
      return res.json({ success: true });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!memStore.favorites.some(f => f.user === user._id && f.movieId === movieId)) {
      memStore.favorites.push({ id: String(memStore.nextId.favorite++), user: user._id, movieId, movieTitle: movieTitle || '', posterPath: posterPath || '', createdAt: new Date() });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Favorites error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

app.get('/api/favorites', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const favorites = await Favorite.find({ user: user._id }).lean();
      return res.json({ favorites });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userFavs = memStore.favorites.filter(f => f.user === user._id);
    res.json({ favorites: userFavs });
  } catch (error) {
    console.error('Favorites fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

app.delete('/api/favorites/:movieId', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      await Favorite.deleteOne({ user: user._id, movieId: req.params.movieId });
      const favorites = await Favorite.find({ user: user._id }).lean();
      return res.json({ favorites });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    memStore.favorites = memStore.favorites.filter(f => !(f.user === user._id && f.movieId === req.params.movieId));
    const userFavs = memStore.favorites.filter(f => f.user === user._id);
    res.json({ favorites: userFavs });
  } catch (error) {
    console.error('Favorites delete error:', error);
    res.status(500).json({ error: 'Failed to delete favorite' });
  }
});

// === LIKES (real like counts across all users) ===
// Single-movie like summary. Also used to compute liked state for the caller.
app.get('/api/movies/:id/likes', async (req, res) => {
  let liked = false;
  try {
    const count = isDbConnected()
      ? await Favorite.countDocuments({ movieId: String(req.params.id) })
      : memStore.favorites.filter(f => f.movieId === String(req.params.id)).length;
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
    const decoded = getUserFromToken(token);
    if (decoded) {
      if (isDbConnected()) {
        liked = !!(await Favorite.findOne({ user: decoded.id, movieId: String(req.params.id) }));
      } else {
        const user = findMemUser('_id', decoded.id);
        liked = user ? memStore.favorites.some(f => f.user === user._id && f.movieId === String(req.params.id)) : false;
      }
    }
    res.json({ count, liked });
  } catch (error) {
    console.error('Likes count error:', error);
    res.status(500).json({ count: 0, liked: false });
  }
});

// Batch like counts for a set of movie ids (used by the home grid / browse rows)
app.post('/api/movies/likes', async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean).map(String) : [];
  const counts = {};
  const liked = {};
  if (!ids.length) return res.json({ counts, liked });
  try {
    if (isDbConnected()) {
      const agg = await Favorite.aggregate([
        { $match: { movieId: { $in: ids } } },
        { $group: { _id: '$movieId', count: { $sum: 1 } } }
      ]);
      agg.forEach(a => { counts[a._id] = a.count; });
      const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
      const decoded = getUserFromToken(token);
      if (decoded) {
        const myFavs = await Favorite.find({ user: decoded.id, movieId: { $in: ids } }).lean();
        myFavs.forEach(f => { liked[f.movieId] = true; });
      }
    } else {
      ids.forEach(id => {
        counts[id] = memStore.favorites.filter(f => f.movieId === id).length;
      });
      const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
      const decoded = getUserFromToken(token);
      if (decoded) {
        const user = findMemUser('_id', decoded.id);
        if (user) memStore.favorites.forEach(f => { if (f.user === user._id && ids.includes(f.movieId)) liked[f.movieId] = true; });
      }
    }
    res.json({ counts, liked });
  } catch (error) {
    console.error('Batch likes error:', error);
    res.status(500).json({ counts, liked });
  }
});

// === NOTIFICATIONS ===
app.get('/api/notifications', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (isDbConnected()) {
      const notifs = await Notification.find({ user: decoded.id }).sort({ createdAt: -1 }).limit(50).lean();
      return res.json({ notifications: notifs.map(n => ({ id: n._id, type: n.type, title: n.title, body: n.body, movieId: n.movieId, read: n.read, createdAt: n.createdAt })) });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userNotifs = (memStore.notifications || []).filter(n => n.user === user._id).slice(0, 50);
    res.json({ notifications: userNotifs.map(n => ({ id: n.id, type: n.type, title: n.title, body: n.body, movieId: n.movieId, read: n.read, createdAt: n.createdAt })) });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ notifications: [] });
  }
});

app.post('/api/notifications/:id/read', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (isDbConnected()) {
      await Notification.updateOne({ _id: req.params.id, user: decoded.id }, { $set: { read: true } });
      return res.json({ success: true });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const n = (memStore.notifications || []).find(x => x.id === req.params.id && x.user === user._id);
    if (n) n.read = true;
    res.json({ success: true });
  } catch (error) {
    console.error('Notification read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.post('/api/notifications/read-all', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (isDbConnected()) {
      await Notification.updateMany({ user: decoded.id }, { $set: { read: true } });
      return res.json({ success: true });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    (memStore.notifications || []).forEach(n => { if (n.user === user._id) n.read = true; });
    res.json({ success: true });
  } catch (error) {
    console.error('Notification read-all error:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Manual check for new arrivals (frontend ping) — same logic as the scheduled job
app.post('/api/notifications/check', async (req, res) => {
  let created = 0;
  try {
    created = await notifyNewMovies();
    res.json({ created });
  } catch (error) {
    console.error('Notification check error:', error);
    res.status(500).json({ error: 'Failed to check for new movies' });
  }
});

// === SUBSCRIPTION / PAYMENT (MTN Mobile Money) ===
app.get('/api/subscription/status', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    let user;
    if (isDbConnected()) {
      user = await User.findById(decoded.id);
    } else {
      user = findMemUser('_id', decoded.id);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    const now = Date.now();
    const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    const subscriptionExpiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
    const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now) / 86400000)) : 0;
    const lifetimeFree = user.lifetimeFree === true;
    const isPremium = lifetimeFree || (user.subscriptionTier === 'premium' && (!subscriptionExpiry || subscriptionExpiry.getTime() > now));
    res.json({
      tier: isPremium ? 'premium' : 'free',
      lifetimeFree,
      trialEndsAt: trialEndsAt || null,
      trialDaysLeft: lifetimeFree ? 9999 : trialDaysLeft,
      subscriptionExpiry: subscriptionExpiry || null,
      paymentMethod: user.paymentMethod || { provider: '', number: '', name: '' },
      pricePerMonth: PREMIUM_PRICE,
      currency: MOMO_CURRENCY,
      operator: MOMO_OPERATOR,
      payee: { name: MOMO_PAYEE_NAME, msisdn: MOMO_PAYEE_MSISDN },
      momoConfigured: !!(MOMO_API_USER && MOMO_API_KEY)
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

app.post('/api/subscription/checkout', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    let user;
    if (isDbConnected()) {
      user = await User.findById(decoded.id);
    } else {
      user = findMemUser('_id', decoded.id);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    const number = req.body?.number || user.paymentMethod?.number || '';
    const provider = req.body?.provider || user.paymentMethod?.provider || 'MTN';
    if (!/^\+?[0-9]{9,14}$/.test(String(number).replace(/[\s-]/g, ''))) {
      return res.status(400).json({ error: 'A valid Mobile Money number is required' });
    }

    // Plan-aware pricing: monthly (default) or yearly (10x month price ~ 2 months free)
    const plan = req.body?.plan === 'yearly' ? 'yearly' : 'monthly';
    const months = plan === 'yearly' ? 12 : 1;
    const amount = plan === 'yearly' ? Math.round(PREMIUM_PRICE * 10) : PREMIUM_PRICE;

    user.paymentMethod = { provider, number, name: user.paymentMethod?.name || '' };
    if (isDbConnected()) await user.save();

    if (!MOMO_API_USER || !MOMO_API_KEY) {
      return res.json({
        status: 'config_pending',
        message: 'Mobile Money gateway is being configured. Your number has been saved as your payment method so you are ready to pay when the trial ends.',
        paymentMethod: user.paymentMethod
      });
    }

    const referenceId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const payerNumber = String(number).replace(/[\s-]/g, '');

    const tokenRes = await axios.post(`${MOMO_COLLECTION_BASE}/token/`, null, {
      headers: {
        'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY,
        Authorization: `Basic ${Buffer.from(MOMO_API_USER + ':' + MOMO_API_KEY).toString('base64')}`
      },
      timeout: 15000
    });
    const bearer = tokenRes.data?.access_token;

    await axios.post(`${MOMO_COLLECTION_BASE}/v1_0/requesttopay`, {
      amount: String(Number.isInteger(amount) ? amount : amount.toFixed(2)),
      currency: MOMO_CURRENCY,
      externalId: `filmz-${user._id}-${Date.now()}`,
      payer: { partyIdType: 'MSISDN', partyId: payerNumber },
      payerMessage: `Ka_samuel@250 Filmz premium - 1 month (${MOMO_CURRENCY} ${amount})`,
      payeeNote: 'Filmz premium subscription'
    }, {
      headers: {
        'Authorization': `Bearer ${bearer}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': MOMO_ENV,
        'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    res.json({
      status: 'pending',
      referenceId,
      plan,
      months,
      amount,
      message: `Payment request sent to your Mobile Money. Confirm on your phone to activate ${months} month${months === 1 ? '' : 's'} of premium.`,
      paymentMethod: user.paymentMethod
    });
  } catch (error) {
    console.error('Momo checkout error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment request failed. Please try again or check your number.' });
  }
});

// Verify a pending Momo payment and upgrade the account when paid
app.get('/api/subscription/verify/:referenceId', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (!MOMO_API_USER || !MOMO_API_KEY) {
      return res.json({ success: false, activated: false, message: 'Mobile Money gateway not configured yet.' });
    }
    const tokenRes = await axios.post(`${MOMO_COLLECTION_BASE}/token/`, null, {
      headers: {
        'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY,
        Authorization: `Basic ${Buffer.from(MOMO_API_USER + ':' + MOMO_API_KEY).toString('base64')}`
      },
      timeout: 15000
    });
    const status = await axios.get(`${MOMO_COLLECTION_BASE}/v1_0/requesttopay/${req.params.referenceId}`, {
      headers: {
        'Authorization': `Bearer ${tokenRes.data.access_token}`,
        'X-Target-Environment': MOMO_ENV,
        'Ocp-Apim-Subscription-Key': MOMO_SUBSCRIPTION_KEY
      },
      timeout: 15000
    });
    const paid = status.data?.status === 'SUCCESSFUL';
    if (paid) {
      const months = Math.min(36, Math.max(1, parseInt(req.query.months, 10) || 1));
      const userDoc = isDbConnected() ? await User.findById(decoded.id) : findMemUser('_id', decoded.id);
      const base = userDoc?.subscriptionExpiry && new Date(userDoc.subscriptionExpiry).getTime() > Date.now()
        ? new Date(userDoc.subscriptionExpiry)
        : new Date();
      const expiry = new Date(base.getTime() + months * 30 * 24 * 60 * 60 * 1000);
      if (isDbConnected()) {
        await User.updateOne({ _id: decoded.id }, { $set: { subscriptionTier: 'premium', subscriptionExpiry: expiry } });
      } else {
        const user = userDoc;
        if (user) { user.subscriptionTier = 'premium'; user.subscriptionExpiry = expiry; }
      }
      res.json({ success: true, activated: true, status: status.data?.status, months, message: `Premium activated for ${months} month${months === 1 ? '' : 's'}!` });
    } else {
      res.json({ success: true, activated: false, status: status.data?.status, message: 'Payment still pending.' });
    }
  } catch (error) {
    console.error('Momo verify error:', error.message);
    res.status(500).json({ success: false, error: 'Could not verify payment.' });
  }
});

app.get('/api/recommendations', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const response = await axios.get(`${TMDB_URL}/trending/movie/week`, {
      params: { api_key: process.env.TMDB_KEY, page: 1 }
    });
    res.json({ recommendations: response.data.results.slice(0, 10) });
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

app.get('/api/search/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { query, genre, year, rating, sort_by } = req.query;
    const page = req.query.page || 1;
    let endpoint = `/search/${type}`;
    let params = { api_key: process.env.TMDB_KEY, query: query || '', page };
    if (!query) {
      endpoint = `/discover/${type}`;
      params = { api_key: process.env.TMDB_KEY, page, sort_by: sort_by || 'popularity.desc' };
      if (genre) params.with_genres = genre;
      if (year) params.primary_release_year = year;
      if (rating) params['vote_average.gte'] = rating;
    }
    const response = await axios.get(`${TMDB_URL}${endpoint}`, { params });
    res.json(response.data);
  } catch (error) {
    console.error('Search API Error:', error.message);
    res.status(500).json({ error: 'Failed to search' });
  }
});

app.get('/api/movie/:id/similar', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_URL}/movie/${req.params.id}/similar`, {
      params: { api_key: process.env.TMDB_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch similar movies' });
  }
});

app.get('/api/movie/:id/reviews', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_URL}/movie/${req.params.id}/reviews`, {
      params: { api_key: process.env.TMDB_KEY }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// AI Chat endpoint - proxies Gemini API (key stays on server)
app.post('/api/ai/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  const GEMINI_KEY = process.env.GEMINI_KEY || process.env.VITE_GEMINI_KEY;
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
  }
  try {
    const contents = [];
    const sysPrompt = 'You are a helpful AI assistant for a movie streaming app called "Ka_samuel@250 Filmz". Answer questions helpfully about movies, the app features, or general questions. Keep responses concise and friendly.';
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === 'model' || msg.role === 'assistant') {
          contents.push({ role: 'model', parts: [{ text: msg.content || msg.text }] });
        } else {
          contents.push({ role: 'user', parts: [{ text: msg.content || msg.text }] });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_KEY}`,
      {
        contents,
        systemInstruction: { parts: [{ text: sysPrompt }] }
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    res.json({ response: text });
  } catch (error) {
    console.error('Gemini API error:', error.response?.data?.error?.message || error.message);
    res.status(500).json({
      error: 'AI service error',
      response: 'Sorry, I encountered an error processing your request.'
    });
  }
});

app.get('/api/download/:type/:id', (req, res) => {
  const { type, id } = req.params;
  if (!['movie', 'tv'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
  res.json({
    url: `https://vidsrc.to/${type}/${id}`,
    embedUrl: `https://vidsrc.to/embed/${type}/${id}`,
    alternatives: [`https://www.2embed.cc/${type}/${id}`, `https://player.smashy.stream/${type}/${id}`],
    message: 'Use browser developer tools or video download extensions to download from the streaming page.'
  });
});

// Admin routes
app.get('/api/admin/users', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  try {
    let users;
    if (isDbConnected()) {
      users = (await User.find().lean()).map(toAdminUser);
      const countMap = {};
      (await Favorite.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]))
        .forEach(f => { countMap[String(f._id)] = f.count; });
      const notifMap = {};
      (await Notification.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]))
        .forEach(n => { notifMap[String(n._id)] = n.count; });
      users.forEach(u => {
        u.favoriteCount = countMap[String(u.id)] || 0;
        u.notificationCount = notifMap[String(u.id)] || 0;
      });
    } else {
      users = memStore.users.map(u => ({
        ...toAdminUser(u),
        favoriteCount: memStore.favorites.filter(f => f.user === u._id).length,
        notificationCount: (memStore.notifications || []).filter(n => n.user === u._id).length
      }));
    }
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ users });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ users: [] });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  const userId = req.params.id;
  if (userId === String(decoded.id)) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  try {
    if (isDbConnected()) {
      await User.findByIdAndDelete(userId);
      await Watchlist.deleteMany({ user: userId });
      await WatchHistory.deleteMany({ user: userId });
      await Favorite.deleteMany({ user: userId });
      return res.json({ success: true });
    }
    memStore.users = memStore.users.filter(u => u._id !== userId);
    memStore.watchlists = memStore.watchlists.filter(w => w.user !== userId);
    memStore.watchHistories = memStore.watchHistories.filter(h => h.user !== userId);
    memStore.favorites = memStore.favorites.filter(f => f.user !== userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete user failed:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  try {
    const settings = await getSettings();
    let totalUsers, totalWatchRecords, totalFavorites = 0, totalComments, activeUsers = 0, premiumUsers = 0, trialUsers = 0, lifetimeFreeUsers = 0, openSupportRequests = 0, topMovieViews = [];
    if (isDbConnected()) {
      totalUsers = await User.countDocuments();
      totalWatchRecords = await WatchHistory.countDocuments();
      totalFavorites = await Favorite.countDocuments();
      totalComments = await Comment.countDocuments();
      const users = await User.find().lean();
      users.forEach(u => {
        if (u.active !== false) activeUsers++;
        const exp = u.subscriptionExpiry ? new Date(u.subscriptionExpiry) : null;
        if (u.lifetimeFree === true) { premiumUsers++; lifetimeFreeUsers++; }
        else if (u.subscriptionTier === 'premium' && (!exp || exp.getTime() > Date.now())) premiumUsers++;
        const trial = u.trialEndsAt ? new Date(u.trialEndsAt) : null;
        if (trial && trial.getTime() > Date.now()) trialUsers++;
      });
      openSupportRequests = await SupportRequest.countDocuments({ status: 'open' });
      const viewStatsRaw = await WatchHistory.aggregate([
        { $group: { _id: '$movieTitle', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      topMovieViews = viewStatsRaw.map(item => ({ movieTitle: item._id || 'Unknown movie', views: item.count }));
    } else {
      totalUsers = memStore.users.length;
      totalWatchRecords = memStore.watchHistories.length;
      totalFavorites = memStore.favorites.length;
      totalComments = memStore.comments.length;
      memStore.users.forEach(u => {
        if (u.active !== false) activeUsers++;
        const exp = u.subscriptionExpiry ? new Date(u.subscriptionExpiry) : null;
        if (u.lifetimeFree === true) { premiumUsers++; lifetimeFreeUsers++; }
        else if (u.subscriptionTier === 'premium' && (!exp || exp.getTime() > Date.now())) premiumUsers++;
        const trial = u.trialEndsAt ? new Date(u.trialEndsAt) : null;
        if (trial && trial.getTime() > Date.now()) trialUsers++;
      });
      openSupportRequests = (memStore.supportRequests || []).filter(s => s.status === 'open').length;
      const viewCounts = {};
      memStore.watchHistories.forEach(h => {
        viewCounts[h.movieTitle] = (viewCounts[h.movieTitle] || 0) + 1;
      });
      topMovieViews = Object.entries(viewCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([title, count]) => ({ movieTitle: title || 'Unknown movie', views: count }));
    }
    res.json({
      totalUsers, activeUsers, totalWatchRecords, totalFavorites, totalComments,
      premiumUsers, trialUsers, lifetimeFreeUsers, openSupportRequests,
      monthlyRevenue: premiumUsers * (parseFloat(settings.subscriptionPrice) || 4000),
      currency: settings.subscriptionCurrency || 'RWF',
      topMovieViews
    });
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

const toAdminUser = (u) => ({
  id: u._id,
  email: u.email,
  username: u.username || '',
  name: u.name || '',
  phone: u.phone || '',
  location: u.location || '',
  bio: u.bio || '',
  role: u.role || 'user',
  active: u.active !== false,
  avatar: u.avatar || null,
  notificationsEnabled: u.notificationsEnabled !== false,
  subscriptionTier: u.subscriptionTier || 'free',
  subscriptionExpiry: u.subscriptionExpiry || null,
  lifetimeFree: u.lifetimeFree === true,
  trialEndsAt: u.trialEndsAt || null,
  paymentMethod: u.paymentMethod || { provider: '', number: '', name: '' },
  createdAt: u.createdAt || u._id
});

app.put('/api/admin/users/:id', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  const userId = req.params.id;
  const { active, role, subscriptionTier, subscriptionExpiry, notificationsEnabled, resetTrial, lifetimeFree } = req.body || {};
  if (active === undefined && !role && !subscriptionTier && !subscriptionExpiry && notificationsEnabled === undefined && !resetTrial && lifetimeFree === undefined) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  try {
    const set = {};
    if (typeof active === 'boolean') set.active = active;
    if (role) set.role = ['admin', 'user'].includes(role) ? role : 'user';
    if (typeof notificationsEnabled === 'boolean') set.notificationsEnabled = notificationsEnabled;
    if (typeof lifetimeFree === 'boolean') set.lifetimeFree = lifetimeFree;
    if (subscriptionTier) set.subscriptionTier = subscriptionTier === 'premium' ? 'premium' : 'free';
    if (subscriptionExpiry) set.subscriptionExpiry = new Date(subscriptionExpiry);
    if (resetTrial) set.trialEndsAt = new Date(Date.now() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000);
    // Blocking a user also revokes nothing else; unblocking restores access
    if (isDbConnected()) {
      await User.updateOne({ _id: userId }, { $set: set });
      return res.json({ success: true, user: toAdminUser(await User.findById(userId).lean()) });
    }
    const user = findMemUser('_id', userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    Object.assign(user, set);
    res.json({ success: true, user: toAdminUser(user) });
  } catch (error) {
    console.error('Admin update user failed:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.post('/api/admin/notifications/broadcast', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  const { title, body, type } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });
  try {
    let sent = 0;
    if (isDbConnected()) {
      const users = await User.find({ active: { $ne: false }, notificationsEnabled: true }).lean();
      const docs = users.map(u => ({ user: u._id, type: type || 'admin', title, body }));
      await Notification.insertMany(docs);
      sent = docs.length;
    } else {
      memStore.users.forEach(u => {
        if (u.active !== false && u.notificationsEnabled !== false) {
          memStore.notifications.push({
            id: String(memStore.nextId.notification++),
            user: u._id, type: type || 'admin', title, body,
            movieId: '', read: false, createdAt: new Date()
          });
          sent++;
        }
      });
    }
    res.json({ success: true, sent });
  } catch (error) {
    console.error('Broadcast failed:', error);
    res.status(500).json({ error: 'Broadcast failed' });
  }
});

app.get('/api/admin/comments', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  try {
    let comments;
    if (isDbConnected()) {
      comments = (await Comment.find().sort({ createdAt: -1 }).limit(200).lean())
        .map(c => ({ id: c._id, movieId: c.movieId, userName: c.userName, text: c.text, date: c.createdAt }));
    } else {
      comments = memStore.comments.slice().reverse().map(c => ({ ...c, date: new Date(c.date) }));
    }
    res.json({ comments });
  } catch (error) {
    console.error('Admin comments fetch error:', error);
    res.status(500).json({ comments: [] });
  }
});

app.delete('/api/admin/comments/:id', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  const commentId = req.params.id;
  try {
    if (isDbConnected()) {
      await Comment.deleteOne({ _id: commentId });
    } else {
      memStore.comments = memStore.comments.filter(c => c.id !== commentId && c._id !== commentId);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete comment failed:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

app.get('/api/admin/settings', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  try {
    res.json({ settings: await getSettings() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// === Support / Help requests ===
app.post('/api/support', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  const { subject, message } = req.body || {};
  if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });
  try {
    let user;
    if (isDbConnected()) user = await User.findById(decoded.id);
    else user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (isDbConnected()) {
      const doc = await SupportRequest.create({
        user: user._id,
        userName: user.username || user.name || (user.email || '').split('@')[0],
        email: user.email,
        subject: String(subject).slice(0, 200),
        message: String(message).slice(0, 2000),
        status: 'open',
        replies: []
      });
      return res.json({ id: doc._id, status: 'open' });
    }
    const support = {
      id: String(memStore.nextId.support++),
      user: user._id,
      userName: user.username || user.name || (user.email || '').split('@')[0],
      email: user.email,
      subject: String(subject).slice(0, 200),
      message: String(message).slice(0, 2000),
      status: 'open',
      replies: [],
      createdAt: new Date()
    };
    memStore.supportRequests.push(support);
    res.json({ id: support.id, status: 'open' });
  } catch (error) {
    console.error('Support submit error:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

app.get('/api/support/mine', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (isDbConnected()) {
      const docs = await SupportRequest.find({ user: decoded.id }).sort({ createdAt: -1 }).lean();
      return res.json({ requests: docs.map(d => ({
        id: d._id, subject: d.subject, message: d.message, status: d.status,
        createdAt: d.createdAt, replies: d.replies || []
      })) });
    }
    const requests = (memStore.supportRequests || [])
      .filter(s => String(s.user) === String(decoded.id))
      .slice().reverse();
    res.json({ requests });
  } catch (error) {
    console.error('Support list error:', error);
    res.status(500).json({ requests: [] });
  }
});

app.get('/api/admin/support', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  try {
    let requests;
    if (isDbConnected()) {
      requests = (await SupportRequest.find().sort({ createdAt: -1 }).limit(300).lean());
    } else {
      requests = (memStore.supportRequests || []).slice().reverse();
    }
    res.json({ requests: requests.map(r => ({
      id: r.id || r._id,
      user: r.user,
      userName: r.userName,
      email: r.email,
      subject: r.subject,
      message: r.message,
      status: r.status,
      replies: r.replies || [],
      createdAt: r.createdAt
    })) });
  } catch (error) {
    console.error('Admin support fetch error:', error);
    res.status(500).json({ requests: [] });
  }
});

app.post('/api/admin/support/:id/reply', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  const supportId = req.params.id;
  const { reply } = req.body || {};
  if (!reply || !String(reply).trim()) return res.status(400).json({ error: 'Reply text is required' });
  try {
    const replyObj = { by: 'admin', text: String(reply).trim().slice(0, 2000), date: new Date() };
    if (isDbConnected()) {
      await SupportRequest.updateOne(
        { _id: supportId },
        { $set: { status: 'open' }, $push: { replies: replyObj } }
      );
      const doc = await SupportRequest.findById(supportId).lean();
      if (doc) {
        await Notification.create({ user: doc.user, type: 'support', title: 'Admin replied to your request', body: replyObj.text, movieId: '', read: false });
      }
      return res.json({ success: true, request: { id: doc?._id, status: 'open', replies: (doc?.replies || []) } });
    }
    const support = (memStore.supportRequests || []).find(s => s.id === supportId);
    if (!support) return res.status(404).json({ error: 'Request not found' });
    support.replies = support.replies || [];
    support.replies.push(replyObj);
    support.status = 'open';
    const user = findMemUser('_id', support.user);
    if (user && user.notificationsEnabled !== false && user.active !== false) {
      memStore.notifications.push({
        id: String(memStore.nextId.notification++),
        user: user._id, type: 'support', title: 'Admin replied to your request', body: replyObj.text,
        movieId: '', read: false, createdAt: new Date()
      });
    }
    res.json({ success: true, request: { id: support.id, status: support.status, replies: support.replies } });
  } catch (error) {
    console.error('Admin support reply error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

app.post('/api/admin/support/:id/status', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  const supportId = req.params.id;
  const { status } = req.body || {};
  if (status !== 'open' && status !== 'resolved') return res.status(400).json({ error: 'Invalid status' });
  try {
    if (isDbConnected()) {
      await SupportRequest.updateOne({ _id: supportId }, { $set: { status } });
      return res.json({ success: true, status });
    }
    const support = (memStore.supportRequests || []).find(s => s.id === supportId);
    if (!support) return res.status(404).json({ error: 'Request not found' });
    support.status = status;
    res.json({ success: true, status });
  } catch (error) {
    console.error('Admin support status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.delete('/api/admin/support/:id', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  const supportId = req.params.id;
  try {
    if (isDbConnected()) await SupportRequest.deleteOne({ _id: supportId });
    else memStore.supportRequests = (memStore.supportRequests || []).filter(s => s.id !== supportId);
    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete support error:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

app.put('/api/admin/settings', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  try {
    const allowed = ['siteName', 'siteTagline', 'siteDescription', 'footerAbout', 'footerText', 'adminEmail', 'instagram', 'whatsapp', 'phone', 'email', 'freeTrialDays', 'subscriptionPrice', 'subscriptionCurrency', 'features', 'siteTheme', 'availableThemes'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (patch.subscriptionPrice !== undefined) patch.subscriptionPrice = parseFloat(patch.subscriptionPrice) || 4000;
    if (patch.freeTrialDays !== undefined) patch.freeTrialDays = parseInt(patch.freeTrialDays, 10) || 365;
    const saved = await saveSettings(patch);
    res.json({ settings: saved });
  } catch (error) {
    console.error('Save settings failed:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// === Song playlists (users build their own music playlists) ===
const toPlaylistPublic = (p) => ({
  id: p.id || p._id,
  name: p.name,
  description: p.description || '',
  coverVideoId: p.coverVideoId || '',
  songs: p.songs || [],
  songCount: (p.songs || []).length,
  createdAt: p.createdAt
});

app.post('/api/playlists', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Playlist name required' });
  const description = String(req.body.description || '').trim();
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const created = await SongPlaylist.create({ user: user._id, name, description, songs: [] });
      return res.json(toPlaylistPublic(created));
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newList = { id: String(memStore.nextId.songPlaylist++), user: user._id, name, description, coverVideoId: '', songs: [], createdAt: new Date() };
    memStore.songPlaylists.push(newList);
    res.json(toPlaylistPublic(newList));
  } catch (error) {
    console.error('Playlist creation error:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

app.get('/api/playlists/mine', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const lists = await SongPlaylist.find({ user: user._id }).sort({ createdAt: -1 }).lean();
      return res.json({ playlists: lists.map(l => ({ ...toPlaylistPublic(l), id: l._id })) });
    }
    const user = findMemUser('_id', decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const lists = memStore.songPlaylists.filter(p => p.user === user._id).slice().reverse();
    res.json({ playlists: lists.map(toPlaylistPublic) });
  } catch (error) {
    console.error('Playlists fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

app.post('/api/playlists/:id/songs', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.params;
  const song = req.body.song || {};
  if (!song.videoId) return res.status(400).json({ error: 'Song videoId required' });
  try {
    if (isDbConnected()) {
      const playlist = await SongPlaylist.findById(id);
      if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
      if (playlist.user.toString() !== decoded.id) return res.status(403).json({ error: 'Not your playlist' });
      const exists = (playlist.songs || []).some(s => s.videoId === song.videoId);
      if (exists) return res.status(409).json({ error: 'Song already in this playlist' });
      const entry = {
        videoId: song.videoId,
        title: song.title || '',
        channelTitle: song.channelTitle || '',
        thumbnail: song.thumbnail || '',
        duration: song.duration || '',
        viewCount: song.viewCount || '',
        addedAt: new Date()
      };
      playlist.songs.push(entry);
      await playlist.save();
      return res.json(toPlaylistPublic(playlist));
    }
    const user = findMemUser('_id', decoded.id);
    const playlist = memStore.songPlaylists.find(p => p.id === id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.user !== user._id) return res.status(403).json({ error: 'Not your playlist' });
    if ((playlist.songs || []).some(s => s.videoId === song.videoId)) return res.status(409).json({ error: 'Song already in this playlist' });
    playlist.songs.push({
      videoId: song.videoId,
      title: song.title || '',
      channelTitle: song.channelTitle || '',
      thumbnail: song.thumbnail || '',
      duration: song.duration || '',
      viewCount: song.viewCount || '',
      addedAt: new Date()
    });
    res.json(toPlaylistPublic(playlist));
  } catch (error) {
    console.error('Add song error:', error);
    res.status(500).json({ error: 'Failed to add song' });
  }
});

app.delete('/api/playlists/:id/songs/:videoId', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  const { id, videoId } = req.params;
  try {
    if (isDbConnected()) {
      const playlist = await SongPlaylist.findById(id);
      if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
      if (playlist.user.toString() !== decoded.id) return res.status(403).json({ error: 'Not your playlist' });
      playlist.songs = (playlist.songs || []).filter(s => s.videoId !== videoId);
      await playlist.save();
      return res.json(toPlaylistPublic(playlist));
    }
    const user = findMemUser('_id', decoded.id);
    const playlist = memStore.songPlaylists.find(p => p.id === id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.user !== user._id) return res.status(403).json({ error: 'Not your playlist' });
    playlist.songs = (playlist.songs || []).filter(s => s.videoId !== videoId);
    res.json(toPlaylistPublic(playlist));
  } catch (error) {
    console.error('Remove song error:', error);
    res.status(500).json({ error: 'Failed to remove song' });
  }
});

app.delete('/api/playlists/:id', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.params;
  try {
    if (isDbConnected()) {
      const playlist = await SongPlaylist.findById(id);
      if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
      if (playlist.user.toString() !== decoded.id) return res.status(403).json({ error: 'Not your playlist' });
      await SongPlaylist.deleteOne({ _id: playlist._id });
      return res.json({ ok: true });
    }
    const user = findMemUser('_id', decoded.id);
    const idx = memStore.songPlaylists.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Playlist not found' });
    if (memStore.songPlaylists[idx].user !== user._id) return res.status(403).json({ error: 'Not your playlist' });
    memStore.songPlaylists.splice(idx, 1);
    res.json({ ok: true });
  } catch (error) {
    console.error('Playlist delete error:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// === Visitor & music-play tracking (powers admin analytics) ===
const clientIp = (req) => (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();

app.post('/api/track/visit', async (req, res) => {
  const page = String(req.body.page || '/').slice(0, 120);
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  const decoded = getUserFromToken(token);
  const entry = {
    page, ip: clientIp(req), userAgent: (req.headers['user-agent'] || '').slice(0, 200),
    source: 'web', userId: decoded?.id || null, createdAt: new Date()
  };
  try {
    if (isDbConnected()) await Visit.create(entry);
    else memStore.visits.push({ id: String(memStore.nextId.visit++), ...entry });
    res.json({ ok: true });
  } catch (error) {
    console.error('Visit track error:', error);
    res.status(500).json({ error: 'Failed to record visit' });
  }
});

app.post('/api/track/play', async (req, res) => {
  const entry = {
    videoId: String(req.body.videoId || '').slice(0, 60),
    title: String(req.body.title || '').slice(0, 200),
    channelTitle: String(req.body.channelTitle || '').slice(0, 120),
    createdAt: new Date()
  };
  if (!entry.videoId) return res.status(400).json({ error: 'videoId required' });
  try {
    if (isDbConnected()) await MusicPlay.create(entry);
    else memStore.musicPlays.push({ id: String(memStore.nextId.musicPlay++), ...entry });
    res.json({ ok: true });
  } catch (error) {
    console.error('Play track error:', error);
    res.status(500).json({ error: 'Failed to record play' });
  }
});

app.get('/api/admin/analytics', async (req, res) => {
  const decoded = requireAdmin(req, res);
  if (!decoded) return;
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000); weekAgo.setHours(0, 0, 0, 0);
  const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  try {
    let totalViews, todayViews, weekViews, uniqueVisitors, viewsByPage = [], popularMusic = [], last7Days, recentVisitors = [];
    if (isDbConnected()) {
      totalViews = await Visit.countDocuments();
      todayViews = await Visit.countDocuments({ createdAt: { $gte: startOfToday } });
      weekViews = await Visit.countDocuments({ createdAt: { $gte: weekAgo } });
      uniqueVisitors = (await Visit.distinct('ip')).filter(Boolean).length;
      const pageAgg = await Visit.aggregate([
        { $group: { _id: { $ifNull: ['$page', '/'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      viewsByPage = pageAgg.map(x => ({ page: x._id, count: x.count }));
      const musicAgg = await MusicPlay.aggregate([
        { $group: { _id: { $ifNull: ['$title', 'Untitled'] }, videoId: { $first: '$videoId' }, channelTitle: { $first: { $ifNull: ['$channelTitle', ''] } }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      popularMusic = musicAgg.map(x => ({ title: x._id, videoId: x.videoId, channelTitle: x.channelTitle, plays: x.count }));
      const days = await Visit.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
      ]);
      const byDay = {};
      days.forEach(d => { byDay[d._id] = d.count; });
      last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const k = dayKey(d);
        return { date: k, label: d.toLocaleDateString(undefined, { weekday: 'short' }), count: byDay[k] || 0 };
      });
      recentVisitors = await Visit.find().sort({ createdAt: -1 }).limit(8).lean();
    } else {
      const visits = memStore.visits || [];
      totalViews = visits.length;
      todayViews = visits.filter(v => new Date(v.createdAt) >= startOfToday).length;
      weekViews = visits.filter(v => new Date(v.createdAt) >= weekAgo).length;
      uniqueVisitors = new Set(visits.map(v => v.ip).filter(Boolean)).size;
      const pageMap = {};
      visits.forEach(v => { const p = v.page || '/'; pageMap[p] = (pageMap[p] || 0) + 1; });
      viewsByPage = Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([page, count]) => ({ page, count }));
      const musicMap = {};
      (memStore.musicPlays || []).forEach(m => {
        const t = m.title || 'Untitled';
        if (!musicMap[t]) musicMap[t] = { title: t, videoId: m.videoId, channelTitle: m.channelTitle, plays: 0 };
        musicMap[t].plays++;
      });
      popularMusic = Object.values(musicMap).sort((a, b) => b.plays - a.plays).slice(0, 10);
      const byDay = {};
      visits.forEach(v => {
        const d = new Date(v.createdAt);
        if (d >= weekAgo) { byDay[dayKey(d)] = (byDay[dayKey(d)] || 0) + 1; }
      });
      last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const k = dayKey(d);
        return { date: k, label: d.toLocaleDateString(undefined, { weekday: 'short' }), count: byDay[k] || 0 };
      });
      recentVisitors = visits.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
    }
    const maxDay = Math.max(1, ...(last7Days || []).map(d => d.count));
    res.json({
      totalViews, todayViews, weekViews, uniqueVisitors, viewsByPage, popularMusic, last7Days,
      maxDay,
      recentVisitors: recentVisitors.map(v => ({ page: v.page || '/', ip: v.ip || '', createdAt: v.createdAt }))
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// === YOUTMUS - YouTube Music proxy (key stays server-side) ===
const YOUTUBE_API_KEY = process.env.YOUTUBE_KEY || '';
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

const formatYtDuration = (iso) => {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const sec = parseInt(m[3] || '0', 10);
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${min}:${String(sec).padStart(2, '0')}`;
};

const toMusicItem = (v) => {
  const snip = v.snippet || {};
  const thumbs = snip.thumbnails || {};
  const stat = v.statistics || {};
  return {
    id: v.id?.videoId || v.id,
    title: snip.title || 'Untitled song',
    description: snip.description || '',
    channelId: snip.channelId || '',
    channelTitle: snip.channelTitle || '',
    publishedAt: snip.publishedAt || null,
    thumbnail: (thumbs.high?.url) || (thumbs.medium?.url) || (thumbs.default?.url) || '',
    duration: formatYtDuration(v.contentDetails?.duration),
    viewCount: stat.viewCount || '0',
    likeCount: stat.likeCount || '0'
  };
};

app.get('/api/youtube/trending', async (req, res) => {
  if (!YOUTUBE_API_KEY) return res.status(502).json({ error: 'YouTube API key is not configured' });
  const max = Math.min(parseInt(req.query.max || '30', 10) || 30, 50);
  try {
    const { data } = await axios.get(`${YT_BASE}/videos`, {
      params: {
        part: 'snippet,contentDetails,statistics',
        chart: 'mostPopular',
        videoCategoryId: 10,
        maxResults: max,
        key: YOUTUBE_API_KEY
      },
      timeout: 20000
    });
    res.json({ kind: 'trending', label: 'Trending Music', results: (data.items || []).map(toMusicItem) });
  } catch (error) {
    console.error('YouTube trending error:', error.message);
    res.status(502).json({ error: 'Could not reach YouTube right now (trending). Try again in a moment.' });
  }
});

app.get('/api/youtube/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Search query is required' });
  if (!YOUTUBE_API_KEY) return res.status(502).json({ error: 'YouTube API key is not configured' });
  const max = Math.min(parseInt(req.query.max || '30', 10) || 30, 50);
  try {
    const searchRes = await axios.get(`${YT_BASE}/search`, {
      params: {
        part: 'snippet',
        type: 'video',
        videoCategoryId: 10,
        videoType: 'any',
        maxResults: max,
        q,
        key: YOUTUBE_API_KEY
      },
      timeout: 20000
    });
    const items = searchRes.data.items || [];
    const ids = items.map(i => i.id?.videoId).filter(Boolean);
    let statsMap = {};
    if (ids.length) {
      const detailRes = await axios.get(`${YT_BASE}/videos`, {
        params: {
          part: 'contentDetails,statistics',
          id: ids.join(','),
          key: YOUTUBE_API_KEY
        },
        timeout: 20000
      });
      (detailRes.data.items || []).forEach(v => { statsMap[v.id] = v; });
    }
    const results = items.map(i => toMusicItem({
      id: i.id,
      snippet: i.snippet,
      contentDetails: statsMap[i.id?.videoId]?.contentDetails,
      statistics: statsMap[i.id?.videoId]?.statistics
    }));
    res.json({ kind: 'search', label: `Results for "${q}"`, query: q, results });
  } catch (error) {
    console.error('YouTube search error:', error.message);
    res.status(502).json({ error: 'Could not search YouTube right now. Try again in a moment.' });
  }
});

app.listen(PORT, () => {
    console.log(`Ka_samuel@250 Backend Active on port ${PORT}`);
    console.log(`MongoDB: ${isDbConnected() ? 'Connected' : 'Using in-memory store'}`);
    console.log(`AI model: gemini-3.6-flash`);
});

// === NEW MOVIE NOTIFIER ===
// Looks for movies added to TMDB within the last 3 days and notifies users.
const emittedMovieIds = new Set();

const isNewMovie = (movie) => {
  const date = new Date(movie.release_date || movie.first_air_date);
  return !isNaN(date.getTime()) && Date.now() - date.getTime() < 3 * 24 * 60 * 60 * 1000 && date.getTime() < Date.now();
};

const notifyNewMovies = async () => {
  let created = 0;
  try {
    const response = await axios.get(`${TMDB_URL}/movie/now_playing`, {
      params: { api_key: process.env.TMDB_KEY, page: 1 }
    });
    const fresh = (response.data.results || []).filter(m => isNewMovie(m));
    const targetIds = fresh.filter(m => !emittedMovieIds.has(String(m.id))).slice(0, 10);
    if (!targetIds.length) return 0;

    targetIds.forEach(m => emittedMovieIds.add(String(m.id)));

    const recipients = isDbConnected()
      ? await User.find({ notificationsEnabled: true }).lean()
      : memStore.users.filter(u => u.notificationsEnabled !== false);

    for (const user of recipients) {
      for (const movie of targetIds) {
        const title = movie.title || movie.name || 'A new title';
        if (isDbConnected()) {
          const exists = await Notification.findOne({ user: user._id, movieId: String(movie.id) });
          if (!exists) {
            await Notification.create({
              user: user._id, type: 'new-movie', title: 'New movie arrived 🎬',
              body: `${title} just arrived in the theater. Watch it now!`,
              movieId: String(movie.id)
            });
            created++;
          }
        } else {
          const userObj = user;
          if (!(memStore.notifications || []).some(n => n.user === userObj._id && n.movieId === String(movie.id))) {
            memStore.notifications.push({
              id: String(memStore.nextId.notification++), user: userObj._id, type: 'new-movie',
              title: 'New movie arrived 🎬', body: `${title} just arrived in the theater. Watch it now!`,
              movieId: String(movie.id), read: false, createdAt: new Date()
            });
            created++;
          }
        }
      }
    }
    return created;
  } catch (error) {
    console.error('New-movie notifier error:', error.message);
    return 0;
  }
};

// Run once on boot, then every 45 minutes
setTimeout(notifyNewMovies, 20 * 1000);
setInterval(notifyNewMovies, 45 * 60 * 1000);
