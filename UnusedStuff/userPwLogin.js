// endpoints originally for username password login

// login check for user
app.post('/login', async (req, res) => {
    let data = req.body;
    try {
        let user = await db.getUser(data.username);
        // password check logic
        if (user.password === data.password) {
            // proceed to main calendar application
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        } 
    } catch (e) {
        res.status(500).json({ message: e });
    }
})
// update the user data, if id_token can be verified
app.put('/login', async (req, res) => {
    let data = req.body;
    var id_token = data.id_token;
    const verifiedPayload = await verifyIdToken(id_token);
    //console.log(verifiedPayload);


    if (verifiedPayload) {
        // Check the criteria you mentioned
        // const { aud, iss, exp, hd, email } = verifiedPayload;

        if (aud === process.env.CLIENT_ID 
            && (iss === 'accounts.google.com' || iss === 'https://accounts.google.com') 
            && exp > Math.floor(Date.now() / 1000)
            && data.username == email) {
            // The ID token is valid and satisfies the criteria
            console.log("\nuser id_token is verified! \nMoving onto updating the user data");

            // Now you can update the user data
            try {
                let user = await db.getUser(data.username);
                if (user) {
                    await db.updateUser(data).then((updatedUser) => {
                        console.log( updatedUser );
                        return res.status(200).json({ updatedUser });
                    }); // Update user data in the database
                } else {
                    res.status(500).json({ message: 'User was not found, so cannot update user data' });
                }
            } catch (e) {
                res.status(500).json({ message: e });
            }
        } else {
            res.status(400).json({ message: 'Invalid ID token' });
        }
    } else {
        res.status(400).json({ message: 'Error with verifyIdToken() function' });
    }
})

// register a user 
app.post('/register', async (req, res) => {
    const data = req.body;
    try {
        let checkUser = await db.getUser(data.username);
        if (checkUser !== false) {
            res.status(400).json({ message: 'Username/Email already exists' });
        } else {
            console.log('/register : adding a new user');
            await db.addUser(data);
            res.status(200).json({ result: 'register' });
        }
    } catch (e) {
        res.status(500).json({ message: e });
    }
})