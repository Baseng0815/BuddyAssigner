/* imports */
const express       = require('express');
const cors          = require('cors');
const MongoClient   = require('mongodb').MongoClient;
const fs 	    = require('fs');
const https	    = require('https');
const nodemailer    = require('nodemailer');
const util          = require('util');

const {
    conf,
    registerMail,
    bigBuddyAssignedMail,
    smallBuddyAssignedMail } = require('./config');

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: conf.mailFrom,
        pass: conf.mailPass
    }
});

async function sendMail(to, subject, text) {
    mailTransporter.sendMail({
        from: conf.mailFrom,
        to, subject, text
    }, (err, info) => {
        if (err) {
            console.log('Failed to send mail to %s: %s', to, err);
            return;
        }

        console.log('Mail sent to %s: %s', to, info.response);
    });
}

var db;
const app = express();

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
async function deleteAssignedBuddies(user) {
    const users = db.collection('users');

    for (let buddy of user.buddys) {
        users.updateOne({ email: buddy }, { $pull: { buddys: user.email } });
        users.updateOne({ email: user.email }, { $pull: { buddys: buddy } })
    }
}

/* middlewares */
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* routes */
app.get('/', (req, res) => {
    res.send('Root sweet root');
});

/* ---------- get users(s) ---------- */
function validateGetUsers(req, res) {
    const passInput = req.headers.authorization.split(' ')[1];
    if (passInput != conf.adminPass) {
        res.json({
            ok: false,
            message: 'Could not get users due to missing or invalid admin password.'
        });
        return false;
    }

    return true;
}

app.get('/get/users', async (req, res) => {
    if (!validateGetUsers(req, res)) {
        return;
    }

    const users = db.collection('users');
    const userList = await users.find(req.query).toArray();

    res.json({ users: userList});
});
/* ---------- get users(s) ---------- */

/* ---------- delete user ----------- */
function validateDeleteUser(req, res) {
    const passInput = req.headers.authorization.split(' ')[1];
    if (passInput != conf.adminPass) {
        res.json({
            ok: false,
            message: 'Could not delete user due to missing or invalid admin password.'
        });
        return false;
    }

    if (!req.params.email) {
        res.json({
            ok: false,
            message: 'Could not delete user due to missing email field.'
        });
        return false;
    }

    return true;
}

app.delete('/delete/user/:email', async (req, res) => {
    if (!validateDeleteUser(req, res)) {
        return;
    }

    const email = req.params.email;
    const users = db.collection('users');
    const user = await users.findOne({ email });

    users.deleteOne({ email }, (err, obj) => {
        if (err) {
            res.json({
                ok: false,
                message: 'Database error when trying to delete user: ' + err
            });
            return;
        }

        if (obj.deletedCount > 0) {
            deleteAssignedBuddies(user);
            res.json({
                ok: true,
                message: 'User was successfully deleted.'
            });
        } else {
            res.json({
                ok: false,
                message: 'Cannot delete a nonexistent user.'
            });
        }
    });
});
/* ---------- delete user ----------- */


/* ---------- post user ------------ */
function validatePostUser(req, res) {
    const email = req.body.email;
    if (!email) {
        res.json({
            ok: false,
            message: 'Could not post user because email is missing.'
        });
        return false;
    }

    const users = db.collection('users');
    const alreadyExisting = await users.findOne({ email });
    if (alreadyExisting) {
        /* update => admin pass necessary */
        const passInput = req.headers.authorization.split(' ')[1];
        if (passInput != conf.adminPass) {
            res.json({
                ok: false,
                message: 'Could not update user because admin pass is missing or invalid.'
            });
            return false;
        }
    } else {
        /* create => admin or user pass necessary (and a full user struct) */
        const passInput = req.headers.authorization.split(' ')[1];
        if (passInput != conf.adminPass && passInput != conf.userPass) {
            res.json({
                ok: false,
                message: 'Could not create user because admin and user pass is missing or invalid.'
            });
            return false;
        }

        if (!req.body.name || !req.body.faculty ||
            !req.body.typ || !req.body.count) {
            res.json({
                ok: false,
                message: 'Could not create user because some data is missing.'
            });
            return false;
        }
    }

    return true;
}

app.post('/post/user', async (req, res) => {
    if (!validatePostUser(req, res)) {
        return;
    }

    const email     = req.body.email;
    const name      = req.body.name;
    const faculty   = req.body.faculty;
    const type      = req.body.type
    const count     = req.body.count
    const buddys    = req.body.buddy;

    const user = { name, faculty, email, type, count, buddys };

    const users = db.collection('users');
    const alreadyExisting = await users.findOne({ email });
    if (alreadyExisting) {
        /* user exists => update */
        users.updateOne({ email }, { $set: user }, (err, _) => {
            if (err) {
                res.json({
                    ok: false,
                    message: 'Database error when trying to update user: ' + err
                });
                return;
            }

            tryAssignBuddy(user);
            res.json({
                ok: true,
                message: 'User successfully updated.'
            });
        });
    } else {
        /* user doesn't exist => create new */
        user.buddys = [];
        users.insertOne(user, async (err, _) => {
            if (err) {
                res.json({
                    ok: false,
                    message: 'Database error when trying to create user: ' + err
                });
                return;
            }

            /* send confirmation mail */
            sendMail(user.email, 'Registrierung', registerMail);
            tryAssignBuddy(user);
            res.send('Success: User created.');
        });
    }
});

/* connect to database and start server once connected */
MongoClient.connect(conf.mongoUrl, (err, client) => {
    if (err)
        throw err;

    db = client.db('buddyAssigner');
    console.log('Connected to database at ', conf.mongoUrl);

    console.log('Starting server...');
    if (conf.useHttps) {
        const options = {
            cert: conf.httpsCert,
            key: conf.httpsKey
        }
        const server = https.createServer(options, app).listen(conf.port, () => {
            const shost = server.address().address;
            const sport = server.address().port;
            console.log('Server listening at https://%s:%s', shost, sport);
        });
    } else {
        const server = app.listen(conf.port, () => {
            const shost = server.address().address;
            const sport = server.address().port;
            console.log('Server listening at http://%s:%s', shost, sport);
        });
    }
});

