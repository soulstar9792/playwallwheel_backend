// Import necessary libraries
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
require('dotenv').config();

// Import Client and GatewayIntentBits from discord.js
const { Client, GatewayIntentBits } = require('discord.js');

// Create an Express application
const app = express();

// Configure session middleware
app.use(session({
  secret: 'your-session-secret', // Replace with a strong secret
  resave: false,
  saveUninitialized: true,
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Create a new client instance with necessary GatewayIntentBits
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages, // If you want to read messages in guilds
    GatewayIntentBits.MessageContent, // Required for accessing message content
    // Add any other intents your bot needs, don't add more than necessary
  ],
});

// Log in the Discord bot using your bot token
client.login(process.env.DISCORD_BOT_TOKEN).catch(console.error);

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.REDIRECT_URI,
  scope: ['identify', 'email'], // The scopes you want to request
},
async (accessToken, refreshToken, profile, done) => {
  // Handle user profile after authentication
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Login route
app.get('/auth/discord', passport.authenticate('discord'));

// Callback after Discord has authenticated the user
app.get('/auth/discord/callback', 
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to the main page
    res.redirect('http://localhost:3000/dashboard'); // Redirect to your frontend after login
  });

// Logout route
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Route to get user info
app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("User is not authenticated");
  }
  res.json(req.user); // Send the user information back to the frontend
});

// Start the Express server
const PORT = process.env.PORT || 3000; // Set the port number
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});