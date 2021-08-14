const express       = require('express');
const cors          = require('cors');
const MongoClient   = require('mongodb').MongoClient;
const crypto        = require('crypto');
const cookieParser  = require('cookie-parser');
const bodyParser    = require('body-parser');

const mongoUrl = 'mongodb://localhost:27017';
/* TODO put this in .env file with a sane password before deploying
 * oh man, I hope I won't forget this...
 */
const mainPassword = '1234';

const app = express();
var db;

const validateAuth = async (req, res, next) => {
    next();
    return;

    const token = req.cookies.authToken;
    if (token) {
        const tokens = db.collection('authTokens');
        const found = await tokens.findOne({ token: token });
        if (found) {
            next();
            return;
        }
    }

    res.status(400).send('You are not authenticated.');
}

app.use(cookieParser());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Root sweet root');
});;

/* authenticate for main page access */
app.post('/post/authenticate', (req, res) => {
    const password = req.body.password;

    if (!password) {
        res.status(400).send('No password specified.');
        return;
    }

    if (mainPassword === password) {
        const token = crypto.randomBytes(16).toString('hex');
        res.cookie('authToken', token);

        const tokenCollection = db.collection('authTokens');
        tokenCollection.insertOne({ token: token, date: Date.now() });

        res.send('Authenticated.');
        return;
    }

    res.status(400).send('Wrong password.');
});

/* get users(s) */
app.get('/get/users', validateAuth, async (req, res) => {
    const users = db.collection('users');
    const userList = await users.find(req.query).toArray();

    res.json(userList);
});

/* delete user */
app.delete('/delete/user/:email', validateAuth, async (req, res) => {
    const email = req.params.email;
    const users = db.collection('users');
    users.deleteOne({ email }, (err, obj) => {
        if (err) {
            res.status(400).send('Something went wrong.');
            return;
        }

        if (obj.deletedCount > 0)
            res.send('User deleted.');
        else
            res.status(400).send('This user does not exist.');
    });
});

/* create and update users */
app.post('/post/user', validateAuth, async (req, res) => {
    console.log(req.body);
    const name      = req.body.name;
    const faculty   = req.body.faculty;
    const email     = req.body.email;
    const type      = req.body.type;
    const count     = req.body.count;

    if (!email) {
        res.status(400).send('No email specified.');
        return;
    }

    const user = { name, faculty, email, type, count };

    const users = db.collection('users');
    const found = await users.findOne({ email });
    if (found) {
        /* user exists => update */
        users.updateOne({ email }, { $set: user }, (err, res) => {
            if (err) {
                console.log(err);
                res.status(400).send('Something went wrong when updating user.');
            }
        });
        res.send('User updated.');
    } else {
        /* user doesn't exist => create new */
        if (name && faculty && type && count) {
            users.insertOne(user);
            res.send('User inserted.');
        } else {
            res.status(400).send('Missing fields when trying to create user.');
        }
    }
});

/* connect to database and start server once connected */
MongoClient.connect(mongoUrl, (err, client) => {
    if (err)
        throw err;

    db = client.db('buddyAssigner');
    console.log('Connected to database at ', mongoUrl);

    const server = app.listen(8081, () => {
        const host = server.address().address;
        const port = server.address().port;

        console.log('App is listening at http://%s:%s', host, port);
    });
});

