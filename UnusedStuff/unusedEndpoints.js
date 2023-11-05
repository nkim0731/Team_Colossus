// API endpoint to get calendar data for a user by email
// Duplicate endpoint
app.get('/api/calendar', async (req, res) => {
    const useremail = req.query.useremail;

    try {
        // Find the user by their email
        const user = await User.findOne({ username: useremail });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Retrieve the calendar events from the user's data
        const calendarEvents = user.events;

        if (!calendarEvents) {
            return res.status(404).json({ message: 'No calendar events found for this user' });
        }

        res.status(200).json({ events: calendarEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching calendar events' });
    }
});

// testing code that was used for https
app.get('/', (req, res) => {
    if (isHttps) {
        res.send('Hello, Welcome to Calendo using HTTPS on port 8081!');
    } else {
        res.send('Hello, Welcome to Calendo using HTTP on port 3000!');
    }
});

app.get('/check', (req, res) => {
    if (isHttps) {
        res.send('check for https!');
    } else {
        res.send('check for http');
    }
});