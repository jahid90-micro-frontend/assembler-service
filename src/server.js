const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const path = require('path');

const uris = require('./config/uris');

// Create the server
const app = express();

// Configurations
app.use(morgan('tiny'));

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.post('/', async (req, res) => {

    const pageId = req.body.pageId;

    const response = await axios.post(`http://${uris.PAGE_SERVICE_URI}`, { pageId });
    const { title, layout, slots } = response.data;

    await Promise.all(slots.map(async (slot) => {

        if (slot.widget.content) {
            try {
                const response = await axios.get(`http://${uris.BASE_URI}/${slot.widget.content}`);
                slot.widget.content = response.data;
            } catch (err) {
                console.error(err.message);
                slot.widget.content = 'The content is currently unavailable. Please try again later.';
            }
        } else {
            console.debug(`skipping GET for slot.id - no content`);
            slot.widget.content = 'No such widget was found!';
        }

    }));

    console.debug(`assembling page for ${pageId}`);

    res.render(layout, { title, slots });

});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.info(`server is up and running on port: ${port}`);
});
