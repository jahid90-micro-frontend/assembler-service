const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const path = require('path');

const { trace, traceAsync } = require('@jahiduls/lib-tracing');

const pageService = require('./clients/page-service-client');
const commonWidgetsService = require('./clients/common-widgets-client');

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

        const response = await pageService.tracedGet(pageId);
        const { title, layout, slots } = response.data;

        const tracedAll = traceAsync(async (promises) => Promise.all(promises), 'common-widgets--all--get');

        const slotsPromises = slots.map((slot) => {
            return Promise.resolve(slot)
                    .then(({ widget: { uri } }) => {

                        if (!uri) throw new Error(`No uri found for slot: ${slot.id}`);

                        return commonWidgetsService.tracedGet(uri)
                    })
                    .then(({ data }) => {
                        slot.widget.content = data;

                        return Promise.resolve(slot);
                    })
                    .catch((err) => {
                        console.error(err.message);
                        slot.widget.content = 'The content is currently unavailable. Please try again later.';

                        return Promise.resolve(slot);
                    });
        });
        let slotsWithWidgetContent = await tracedAll(slotsPromises);

        const traceRender = trace((layout, data) => res.render(layout, data), 'render-page');
        traceRender(layout, { title, slots: slotsWithWidgetContent, meta: { isDebug } });

    } catch (err) {

        console.error(err.message);

        res.sendStatus(500);
    }
});

module.exports = app;
