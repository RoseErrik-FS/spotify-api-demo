//spotify-api-demo/api/routes/spotifyRoutes.js
const express = require("express");
const router = express.Router();
const spotifyController = require("../controller/spotifyController");

// Define routes and associate them with corresponding controller functions

// Route to initiate user login
router.get("/user-login", spotifyController.initiateLogin);

// Route to authenticate a user using JWT middleware, and call the authenticateUser function from the controller
router.get(
  "/authenticate",
  spotifyController.jwtMiddleware,
  spotifyController.authenticateUser
);

// Route to get an access token using JWT middleware, and call the getToken function from the controller
router.get(
  "/get-token",
  spotifyController.jwtMiddleware,
  spotifyController.getToken
);

// Route to get the status of user authentication using JWT middleware, and call the checkStatus function from the controller
router.get(
  "/get-status",
  spotifyController.jwtMiddleware,
  spotifyController.checkStatus
);

// Route to search tracks using JWT middleware, and call the searchTracks function from the controller
router.get(
  "/search-tracks",
  spotifyController.jwtMiddleware,
  spotifyController.searchTracks
);

// Route to handle the callback after user authorization
router.get("/callback", spotifyController.handleCallback);

module.exports = router;
