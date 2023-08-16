//spotify-api-demo/api/controller/spotifyController.js
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
const querystring = require("querystring");
const axios = require("axios");
const randomstring = require("randomstring");
const { SpotifyToken } = require("../../models/spotifytoken");
const qs = require("qs");

const basicAuth =
  "Basic " +
  Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET).toString(
    "base64"
  );
const redirect_uri = "http://localhost:3001/spotify/v1/auth";
const now = new Date().getTime();

const jwtMiddleware = async (req, res, next) => {
  try {
    req.token = await SpotifyToken.findOne({ where: {} });

    if (!req.token && !req.query.code) {
      return next();
    }

    if (!req.token && req.query.code) {
      const tokenResponse = await exchangeCodeForToken(
        req.query.code,
        "authorization_code",
        SpotifyToken.build({})
      );
      req.token = tokenResponse;
    } else if (now > req.token.expires_in) {
      const tokenResponse = await exchangeCodeForToken(
        req.token.refresh_token,
        "refresh_token",
        req.token
      );
      req.token = tokenResponse;
    }

    if (!req.token) {
      return res.json({ error: "JWT could not be requested..." });
    }

    return next();
  } catch (error) {
    console.error("JWT middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const exchangeCodeForToken = async (code) => {
  try {
    const tokenResponse = await axios({
      method: "POST",
      url: "https://accounts.spotify.com/api/token",
      headers: {
        Authorization: basicAuth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: qs.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirect_uri,
      }),
    });
    return tokenResponse.data;
  } catch (error) {
    throw new Error("Failed to exchange code for token");
  }
};

const getToken = async (req, res, next) => {
  try {
    req.token = await SpotifyToken.findOne({ where: {} });

    if (!req.token && !req.query.code) {
      return next();
    }

    if (!req.token && req.query.code) {
      const tokenResponse = await exchangeCodeForToken(req.query.code);
      req.token = await SpotifyToken.create(tokenResponse);
    } else if (now > req.token.expires_in) {
      const tokenResponse = await exchangeCodeForToken(req.token.refresh_token);
      req.token = await req.token.update(tokenResponse);
    }

    if (!req.token) {
      return res.status(400).json({ error: "Failed to retrieve access token" });
    }

    return next();
  } catch (error) {
    console.error("Access token retrieval error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const authenticateUser = async (req, res) => {
  try {
    if (req.token) {
      const user = { id: req.token.id };
      const token = generateJwtToken(user);
      return res.redirect(`http://localhost:3000?token=${token}`);
    } else {
      return res.redirect("http://localhost:3000/login");
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const checkStatus = async (req, res) => {
  try {
    const isAuthenticated = req.token && req.token.expires_in > now;
    return res.json({ isAuthenticated });
  } catch (error) {
    console.error("Status check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const initiateLogin = async (req, res) => {
  try {
    const state = randomstring.generate(16);
    const authUrl =
      "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID,
        redirect_uri,
        state,
      });

    return res.redirect(authUrl);
  } catch (error) {
    console.error("Login initiation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const searchTracks = async (req, res) => {
  try {
    const response = await axios({
      method: "GET",
      url: "https://api.spotify.com/v1/search",
      params: {
        type: "track",
        q: req.query.q,
        limit: 3,
      },
      headers: {
        Authorization: "Bearer " + req.token.access_token,
        "Content-Type": "application/json",
      },
    });

    return res.json(response.data);
  } catch (error) {
    console.error("Track search error:", error);
    return res.status(500).json({ error: "Failed to search tracks" });
  }
};

const handleCallback = async (req, res) => {
  try {
    const code = req.query.code || null;
    const state = req.query.state || null;

    if (state === null) {
      return res.redirect(
        "/#" + querystring.stringify({ error: "state_mismatch" })
      );
    } else {
      const tokenResponse = await exchangeCodeForToken(code);
      if (!tokenResponse || !tokenResponse.access_token) {
        return res
          .status(400)
          .json({ error: "Failed to retrieve access token" });
      }
      // Handle storing the access token and other necessary information here
      return res.redirect("http://localhost:3000"); // Redirect to app's main page
    }
  } catch (error) {
    console.error("Callback handling error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getToken,
  authenticateUser,
  checkStatus,
  initiateLogin,
  searchTracks,
  handleCallback,
  jwtMiddleware,
};
