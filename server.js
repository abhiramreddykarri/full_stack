var express = require('express');
var app = express();
const admin = require("firebase-admin");
var serviceAccount = require("./key.json");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(bodyParser.urlencoded({ extended: true }));
const db = admin.firestore();
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
}); 

app.get('/sign-up.html', (req, res) => {
    res.sendFile(__dirname + "/sign-up.html");
});

app.post('/storeEmailInfo', (req, res) => {
    console.log(req.body);

    db.collection('send_info').add({
        From: req.body.senderMail,
        Subject: req.body.subject,
        Message: req.body.message
    }).then(() => {
        res.send(`
        <script>
            alert('Saved Successfully');
            window.location.href = 'C:\\Users\\gowth\\OneDrive\\Documents\\work(college)\\public\\front.html'; 
        </script>
    `);
    

    }).catch((error) => {
       console.error("Error storing data: ", error);
       res.status(500).send("Failed to save data");
    });
});

app.post('/retrievesignup', async (req, res) => {
    const userEmail = req.body.email;
    const userPassword = req.body.password;

    try {
        // Check if email already exists in the database
        const emailCheck = await db.collection('UserDetails').where('Email', '==', userEmail).get();

        if (!emailCheck.empty) {
            console.log("Email already exists:", userEmail);
            res.send(`
                <script>
                    alert("Registration failed. Email already in use.");
                    window.location.href = '/sign-up.html'; // Redirect back to sign-up
                </script>
            `);
            return;
        }

        bcrypt.hash(userPassword, saltRounds, function(err, hashedPassword) {
            if (err) {
                console.error("Error hashing password:", err);
                res.status(500).send("Error during registration.");
                return;
            }

            db.collection('UserDetails').add({
                Full_Name: req.body.fullname,
                Email: userEmail,
                Password: hashedPassword
            }).then(() => {
                res.send(`
                    <script>
                        alert('Successfully Registered!');
                        window.location.href ='/';
                    </script>
                `);
            });
        });
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("An error occurred during registration.");
    }
});


app.get('/front.html', (req, res) => {
    res.sendFile(__dirname + '/front.html');
});

app.get('/login.html', (req, res) => {
    res.sendFile(__dirname +"/login.html");
});

app.post('/retrievelogin', async (req, res) => {
    const email = req.body.email;
    const userPassword = req.body.password;

    try {
        const querySnapshot = await db.collection('UserDetails').where('Email', '==', email).get();

        if (querySnapshot.empty) {
            console.log("No user found with email:", email);
            res.send(`
                <script>
                    alert("Login Failed. User not found.");
                    window.location.href = '/login.html'; // Redirect back to login
                </script>
            `);
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const storedHashedPassword = userDoc.data().Password;

        bcrypt.compare(userPassword, storedHashedPassword, function(err, result) {
            if (err) {
                console.error("Error comparing passwords:", err);
                res.status(500).send("An error occurred during login.");
                return;
            }

            if (result) { // Passwords match
                res.send(`
                    <script>
                        alert("Logged-in Successfully");
                        window.location.href = 'front.html';
                    </script>
                `);
            } else { // Passwords don't match
                res.send(`
                    <script>
                        alert("Login Failed. Incorrect password.");
                        window.location.href = '/login.html'; // Redirect back to login
                    </script>
                `);
            }
        });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).send("An error occurred while logging in.");
    }
});



app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
