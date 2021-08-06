const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const path = require('path');

const { traceAsync } = require('@jahiduls/lib-tracing');

const pageService = require('./clients/page-service-client');

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

    try {

        const pageId = req.body.pageId;
        const isDebug = req.query.isDebug;

        console.debug(`Request: {pageId: ${pageId}}`);

        const tracedGetPageMetadata = traceAsync(pageService.get, 'page-service-get');
        const response = await tracedGetPageMetadata(pageId);
        const { title, layout, slots } = response.data;

        await Promise.all(slots.map(async (slot) => {

            if (slot && slot.widget.uri) {
                try {
                    const response = await axios.get(`http://${slot.widget.uri}`);
                    slot.widget.content = response.data;
                } catch (err) {
                    console.error(err.message);
                    slot.widget.content = 'The content is currently unavailable. Please try again later.';
                }
            } else {
                slot = slot || {};
                slot.id = slot.id || 'unknown';
                slot.widget = slot.widget || {};
                slot.widget.content = 'No such widget was found!';

                console.warn(`skipping GET for slot ${slot.id} - no uri`);
            }

        }));

        res.render(layout, { title, slots, meta: { isDebug } });

    } catch (err) {

        console.error(err.message);

        res.sendStatus(500);
    }
});

module.exports = app;
