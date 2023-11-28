const { OAuth2Client } = require('google-auth-library');

class GoogleAuth {
    constructor() {
        this.authClient = new OAuth2Client();
    }

    async verifyUser(id_token, useremail, audience) {
        const ticket = await this.authClient.verifyIdToken({
            idToken: id_token
        });
        const payload = ticket.getPayload();

        if (payload) {
            let { aud, iss, exp, email } = payload;
    
            if (aud === audience
                && (iss === 'accounts.google.com' || iss === 'https://accounts.google.com') 
                && exp > Math.floor(Date.now() / 1000)
                && email == useremail) {
                // hd++; 
                // The ID token is valid and satisfies the criteria
                console.log("\n id_token verified");
                return true;
            }
        }
        return false;
    }
}

module.exports = new GoogleAuth();