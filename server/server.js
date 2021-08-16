const express       = require('express');
const cors          = require('cors');
const MongoClient   = require('mongodb').MongoClient;
const cookieParser  = require('cookie-parser');
const bodyParser    = require('body-parser');

const mongoUrl = 'mongodb://localhost:27017';
/* TODO put this in .env file with a sane password before deploying
 * oh man, I hope I won't forget this...
 */
const adminPass = Buffer.from('1234').toString('base64'); /* updating and deleting */
const userPass  = Buffer.from('1234').toString('base64'); /* registering */

const app = express();
var db;

app.use(cookieParser());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

    const server = app.listen(8081, () => {
        const host = server.address().address;
        const port = server.address().port;

        console.log('App is listening at http://%s:%s', host, port);
    });
});

