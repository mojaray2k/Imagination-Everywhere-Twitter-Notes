var url = require('url');
var express = require('express');
var querystring = require('querystring');
var authenticator = require('./authenticator');
var config = require('./config');
var app = express();

// Add cookie parsing functionality to our Express app
app.use(require('cookie-parser')());

// Take user to Twitter's login page
app.get('/auth/twitter', authenticator.redirectToTwitterLoginPage);

// This is the callback url that the user is redirected to after signing in
app.get(url.parse(config.oauth_callback).path, (req, res) => {
	authenticator.authenticate(req, res, (err) => {
		if (err) {
			console.log(err);
			res.sendStatus(401);
		} else {
			res.send("Authentication Successful");
		}
	});
});

// Tweet
app.get('/tweet', (req, res) => {
	if (!req.cookies.access_token || !req.cookies.access_token_secret) {
		return res.sendStatus(401);
	}

	authenticator.post('https://api.twitter.com/1.1/statuses/update.json',
		req.cookies.access_token, req.cookies.access_token_secret,
		{
			status: "Hello Twitter REST API"
		},
		(error, data) => {
			if (error) {
				return res.status(400).send(error);
			}

			res.send("Tweet successful!");
		});
});

// Search
app.get('/search', (req, res) => {
	if (!req.cookies.access_token || !req.cookies.access_token_secret) {
		return res.sendStatus(401);
	}

	authenticator.get('https://api.twitter.com/1.1/search/tweets.json?' + querystring.stringify({ q: 'French' }),
		req.cookies.access_token, req.cookies.access_token_secret,
		(error, data) => {
			if (error) {
				return res.status(400).send(error);
			}
			res.send(data);
		});
});

// List friends
app.get('/friends', (req, res) => {
	if (!req.cookies.access_token || !req.cookies.access_token_secret) {
		return res.sendStatus(401);
	}

	var url = 'https://api.twitter.com/1.1/friends/list.json';
	if (req.query.cursor) {
		url += '?' + querystring.stringify({ cursor: req.query.cursor });
	}

	authenticator.get(url,
		req.cookies.access_token, req.cookies.access_token_secret,
		(error, data) => {
			if (error) {
				return res.status(400).send(error);
			}
			res.send(data);
		});
});

// Start listening for requests
app.listen(config.port, () => {
	console.log("Listening on port " + config.port);
});