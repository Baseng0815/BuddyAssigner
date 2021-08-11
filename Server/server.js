const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.send('Root sweet root');
});

const server = app.listen(8081, () => {
    const host = server.address().address;
    const port = server.address().port;

    console.log('App is listening at http://%s:%s', host, port);
});
