/*
* This file is for cookie login sessions. Might be easier to manage session on frontend
*/
const crypto = require('crypto');

class SessionError extends Error {};

function Session() {
	const CookieMaxAgeMs = 3600 * 1000 // seconds * ms
	const sessions = {}

	this.parseCookies = (request) => {	
		const list = {};
		const cookieHeader = request.headers?.cookie;
		if (!cookieHeader) return list;

		cookieHeader.split(`;`).forEach((cookie) => {
			let [ name, ...rest] = cookie.split(`=`);
			name = name?.trim();
			if (!name) return;
			const value = rest.join(`=`).trim();
			if (!value) return;
			list[name] = decodeURIComponent(value);
		});
		return list;
	}

	this.createSession = (response, username, id, gold, maxAge = CookieMaxAgeMs) => {
        let token = crypto.randomBytes(20).toString('base64url')
        sessions[token] = { 
			"username": username,
		}

        response.cookie("cpen321-session", token, { maxAge: maxAge })
        setTimeout(() => { delete sessions[token] }, maxAge)
	}

	this.deleteSession = (request) => {
		delete sessions[request.session]
		delete request.username
		delete request.session
	}

	this.checkLogin = (request, response, next) => {
		if (!request.headers.cookie) {
			next(new SessionError)
		} else {
			let cookies = this.parseCookies(request)
			for (let cookie in cookies) {
				if (cookies[cookie] in sessions) {
					request.username = sessions[cookies[cookie]].username
					request.session = cookies[cookie]
					next()
				} else {
					next(new SessionError)
				}
			}
		}
	}

	this.errorHandler = (err, req, res, next) => {
		if (err instanceof SessionError) {
			if (req.headers.accept === 'application/json') {
				res.status(401).send(err)
			} else {
				res.redirect('/login')
			}
		} else {
			res.status(500).send(err)
		}
	}

	this.getUser = (token) => {
		return {
			"username": sessions[token].username,
		}
	}
}

Session.Error = SessionError;

module.exports = Session;