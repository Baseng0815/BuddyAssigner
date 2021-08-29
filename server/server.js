/* imports */
const express       = require('express');
const cors          = require('cors');
const MongoClient   = require('mongodb').MongoClient;
const cookieParser  = require('cookie-parser');
const bodyParser    = require('body-parser');
const fs 	    = require('fs');
const https	    = require('https');
const nodemailer    = require('nodemailer');
const util          = require('util');
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

const bigBuddyAssignedMail =
`Wir haben Ihnen soeben einen grossen Buddy zugeteilt, mit dem Sie sich austauschen koennen.
Er heisst %s und ist unter '%s' erreichbar.

Mit freundlichen Gruessen,
die Stifti-Gruppe Marburg`

const smallBuddyAssignedMail =
`Wir haben Ihnen soeben einen kleinen Buddy zugeteilt, mit dem Sie sich austauschen koennen.
Er heisst %s und ist unter '%s' erreichbar.

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

/* try to find a matching buddy */
const tryAssignBuddy = async (user) => {
    /* we always assign one big buddy to one or more small buddys */
    /* buddys need to be of the same faculty */
    let bigBuddy, smallBuddys = [];
    const users = db.collection('users');

    if (user.type == 'small') {
        /* user already has big buddy => return */
        if (user.buddys.length > 0) {
            return;
        }
        /* find big buddy with free capacity */
        smallBuddys.push(user);
        const bigBuddyArr = await users.find({ type: 'big', faculty: user.faculty }).toArray();
        for (bigBuddy of bigBuddyArr) {
            if (bigBuddy.buddys.length < bigBuddy.count) {
                break;
            }
        }
    } else if (user.type == 'big') {
        let free = user.count - user.buddys.length;
        /* no capacity left => return */
        if (free == 0) {
            return;
        }

        /* find small buddys with free capacity */
        bigBuddy = user;
        const smallBuddyArr = await users.find({ type: 'small', faculty: user.faculty }).toArray();
        for (let smallBuddy of smallBuddyArr) {
            if (free <= 0) {
                break;
            }

            if (smallBuddy.buddys.length == 0) {
                smallBuddys.push(smallBuddy);
                free--;
            }
        }
    }

    if (!(bigBuddy && smallBuddys.length > 0)) {
        /* no matches found */
        return;
    }

    for (let smallBuddy of smallBuddys) {
        bigBuddy.buddys.push(smallBuddy.email);
        smallBuddy.buddys = [ bigBuddy.email ];

        /* send mail to big buddy for each small buddy */
        sendMail(bigBuddy.email, 'Kleiner Buddy zugeteilt',
            util.format(smallBuddyAssignedMail, smallBuddy.name, smallBuddy.email));
        /* send mail to small buddy */
        sendMail(smallBuddy.email, 'Grosser Buddy zugeteilt',
            util.format(bigBuddyAssignedMail, bigBuddy.name, bigBuddy.email));
        console.log(smallBuddy);

        /* update small buddy in database */
        users.updateOne({ email: smallBuddy.email }, { $set: smallBuddy });
    }

    /* update big buddy in database */
    users.updateOne({ email: bigBuddy.email }, { $set: bigBuddy });

    console.log(`Assigned ${smallBuddys} (small) to ${bigBuddy.email} (big).`);
}

/* delete all assigned buddies for a deleted user */
const deleteAssignedBuddies = async (user) => {
    const users = db.collection('users');

    for (let buddy of user.buddys) {
        users.updateOne({ email: buddy }, { $pull: { buddys: user.email } });
        users.updateOne({ email: user.email }, { $pull: { buddys: buddy } })
    }
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
    const user = await users.findOne({ email });

    users.deleteOne({ email }, (err, obj) => {
        if (err) {
            res.status(400).send('Error: Something went wrong.');
            return;
        }

        if (obj.deletedCount > 0) {
            res.send('Success: User deleted.');
            deleteAssignedBuddies(user);
        } else {
            res.status(400).send('Error: This user does not exist.');
        }
    });
});

/* create and update users */
app.post('/post/user', async (req, res) => {
    const name      = req.body.name;
    const faculty   = req.body.faculty;
    const email     = req.body.email;
    const type      = req.body.type
    const count     = req.body.count
    const buddys    = req.body.buddy || [];

    if (!email) {
        res.status(400).send('Error: No email specified.');
        return;
    }

    const user = { name, faculty, email, type, count, buddys };

    const users = db.collection('users');
    const found = await users.findOne({ email });
    if (found) {
        const passInput = req.headers.authorization.split(' ')[1];

        /* user exists => update */
        if (passInput != adminPass) {
            res.status(400).send('Error: Wrong password.');
            return;
        }

        /* TODO assign here */

        users.updateOne({ email }, { $set: user }, (err, a) => {
            if (err) {
                console.log(err);
                res.status(400).send('Error: Something went wrong when updating user.');
                return;
            }

            res.send('Success: User updated.');
            console.log(user);
            tryAssignBuddy(user);
        });
    } else {
        /* user doesn't exist => create new */
        const passInput = req.headers.authorization.split(' ')[1];

        if (passInput != adminPass && passInput != userPass) {
            res.status(400).send('Error: Wrong password.');
            return;
        }

        if (name && faculty && type && count) {
            /* TODO assign here */
            user.buddys = [];
            users.insertOne(user, async (err, _) => {
                if (err) {
                    console.log(err);
                    res.status(400).send('Error: Something went wrong when inserting user.');
                    return;
                }

                /* send confirmation mail */
                sendMail(user.email, 'Registrierung', registerMail);
                res.send('Success: User created.');
                tryAssignBuddy(user);
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

