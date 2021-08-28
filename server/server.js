/* imports */
const express       = require('express');
const cors          = require('cors');
const MongoClient   = require('mongodb').MongoClient;
const cookieParser  = require('cookie-parser');
const bodyParser    = require('body-parser');
const fs 	    = require('fs');
const https	    = require('https');
const nodemailer    = require('nodemailer');
require('dotenv').config();

/* constants and globals */
const mongoUrl  = process.env.MONGOURL || 'mongodb://localhost:27017';
const port 	= process.env.PORT || 8081;
const useHttps  = process.env.HTTPS == 'true';
const mailFrom  = process.env.FROMMAIL;
const mailPass  = process.env.FROMMAILPASS;
const adminPass = Buffer.from(process.env.ADMINPASS).toString('base64'); /* updating and deleting */
const userPass  = Buffer.from(process.env.USERPASS).toString('base64'); /* registering */

const registerMail =
`Registrierung erfolgreich. Sobald ein passender Buddy gefunden wurde, erhalten
Sie eine weitere Mitteilung mit einer Mailadresse, um Kontakt aufzunehmen. Natuerlich
koennen Sie sich auch ueber andere Wege austauschen, wenn dazu die Moeglichkeit besteht :)

Mit freundlichen Gruessen,
die Stifti-Gruppe Marburg`

console.log('Using mailFrom=%s', mailFrom);
const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mailFrom,
        pass: mailPass
    }
});

var db;
const app = express();

/* functions */
const sendMail = (to, subject, text) => {
    mailTransporter.sendMail({
        from: mailFrom,
        to, subject, text
    }, (err, info) => {
        if (err) {
            console.log('Failed to send mail to %s: %s', to, err);
            return;
        }

        console.log('Mail sent to %s: %s', to, info.response);
    });
}

/* middlewares */
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/* routes */
app.get('/', (req, res) => {
    res.send('Root sweet root');
});;

/* get users(s) */
app.get('/get/users', async (req, res) => {
    const passInput = req.headers.authorization.split(' ')[1];
    if (passInput != adminPass) {
        res.status(400).send('Error: Wrong password.');
        return;
    }

    const users = db.collection('users');
    const userList = await users.find(req.query).toArray();

    res.json({ users: userList});
});

/* delete user */
app.delete('/delete/user/:email', async (req, res) => {
    const passInput = req.headers.authorization.split(' ')[1];
    if (passInput != adminPass) {
        res.status(400).send('Error: Wrong password.');
        return;
    }

    const email = req.params.email;
    const users = db.collection('users');

    users.deleteOne({ email }, (err, obj) => {
        if (err) {
            res.status(400).send('Error: Something went wrong.');
            return;
        }

        if (obj.deletedCount > 0)
            res.send('Success: User deleted.');
        else
            res.status(400).send('Error: This user does not exist.');
    });
});

/* create and update users */
app.post('/post/user', async (req, res) => {
    const name      = req.body.name;
    const faculty   = req.body.faculty;
    const email     = req.body.email;
    const type      = req.body.type;
    const count     = req.body.count;

    if (!email) {
        res.status(400).send('Error: No email specified.');
        return;
    }

    const user = { name, faculty, email, type, count };

    const users = db.collection('users');
    const found = await users.findOne({ email });
    if (found) {
        const passInput = req.headers.authorization.split(' ')[1];

        /* user exists => update */
        if (passInput != adminPass) {
            res.status(400).send('Error: Wrong password.');
            return;
        }

        users.updateOne({ email }, { $set: user }, (err, _) => {
            if (err) {
                console.log(err);
                res.status(400).send('Error: Something went wrong when updating user.');
                return;
            }

            res.send('Success: User updated.');
        });
    } else {
        /* user doesn't exist => create new */
        const passInput = req.headers.authorization.split(' ')[1];

        if (passInput != adminPass && passInput != userPass) {
            res.status(400).send('Error: Wrong password.');
            return;
        }

        if (name && faculty && type && count) {
            users.insertOne(user, (err, _) => {
                if (err) {
                    console.log(err);
                    res.status(400).send('Error: Something went wrong when inserting user.');
                    return;
                }

                /* send confirmation mail */
                sendMail(user.email, 'Registrierung', registerMail);
                res.send('Success: User inserted.');
            });
        } else {
            res.status(400).send('Error: Missing fields when trying to create user.');
        }
    }
});

/* connect to database and start server once connected */
MongoClient.connect(mongoUrl, (err, client) => {
    if (err)
        throw err;

    db = client.db('buddyAssigner');
    console.log('Connected to database at ', mongoUrl);

    console.log('Starting server...');
    if (useHttps) {
        const options = {
            cert: fs.readFileSync('/etc/letsencrypt/live/bengel.xyz/fullchain.pem'),
            key: fs.readFileSync('/etc/letsencrypt/live/bengel.xyz/privkey.pem'),
        }
        const server = https.createServer(options, app).listen(port, () => {
            const shost = server.address().address;
            const sport = server.address().port;
            console.log('Server listening at https://%s:%s', shost, sport);
        });
    } else {
        const server = app.listen(port, function() {
            const shost = server.address().address;
            const sport = server.address().port;
            console.log('Server listening at http://%s:%s', shost, sport);
        });
    }
});

