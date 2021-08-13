const express       = require('express');
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
    const token = req.cookies.authToken;
    if (token) {
        const tokens = db.collection('authTokens');
        const found = await tokens.findOne({ token: token });
        if (found) {
            next();
            return;
        }
    }

    res.status(400);
    res.send('You are not authenticated.');
}

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Root sweet root');
});;

app.get('/get/users/:faculty?', (req, res) => {
    console.log('users get');
});

app.get('/get/user/:email', (req, res) => {
    console.log('user get');
});

app.post('/post/authenticate', (req, res) => {
    const password = req.body.password;

    if (!password) {
        res.status(400);
        res.send('No password specified.');
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

    res.status(400);
    res.send('Wrong password.')
});

app.post('/post/user', validateAuth, async (req, res) => {
    const name      = req.body.name;
    const faculty   = req.body.faculty;
    const email     = req.body.email;
    const type      = req.body.type;

    if (!email) {
        res.status(400);
        res.send('No email specified.');
        return;
    }

    const users = db.collection('users');
    const found = await users.findOne({ email });
    if (found) {
        /* user exists => update */
        users.updateOne({ email }, { $set: { name, faculty, email, type } }, (err, res) => {
            if (err) {
                console.log(err);
                res.status(400);
                res.send('Something went wrong when updating the user.');
            }
        });
        res.send('User updated.');
    } else {
        /* user doesn't exist => create new */
        if (name && faculty && type) {
            users.insertOne({ name, faculty, email, type });
            res.send('User inserted.');
        } else {
            res.status(400);
            res.send('Missing fields when trying to insert user.');
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

