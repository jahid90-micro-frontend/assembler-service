const express = require('express');
const morgan = require('morgan');
const path = require('path');

const { trace, traceAsync } = require('@jahiduls/lib-tracing');
const requestId = require('./middlewares/request-id');

const pageService = require('./clients/page-service-client');
const commonHttpService = require('./clients/common-http-client');

// Create the server
const app = express();

// Configurations
app.use(morgan('tiny'));

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(requestId);

// Routes
app.post('/', async (req, res) => {

    try {

        const pageId = req.body.pageId;
        const isDebug = req.query.isDebug;

        console.debug(`Request: {pageId: ${pageId}}`);

        const response = await pageService.tracedGet(pageId);
        const { title, layout, slots, modules } = response.data;

        const tracedAll = traceAsync(async (promises) => Promise.all(promises), 'promises--all--get');

        const slotsPromises = slots.map((slot) => {
            return Promise.resolve(slot)
                    .then(({ widget: { uri } }) => {

                        if (!uri) throw new Error(`No uri found for slot: ${slot.id}`);

                        return commonHttpService.tracedGet(uri)
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

        const modulesPromises = modules.map((module) => {
            return Promise.resolve(module)
                    .then(({ name, content: { uri } }) => {
                        if (!uri) throw new Error(`No uri found for module: ${name}`);

                        return commonHttpService.tracedGet(uri);
                    })
                    .then(({ data }) => {

                        module.content = data;

                        return Promise.resolve(module);
                    })
                    .catch(err => {
                        console.error(err.message);
                        module.content = `<!-- Failed to fetch the content for module: ${module.name} -->`;

                        return Promise.resolve(module);
                    });
        });
        let modulesWithContent = await tracedAll(modulesPromises);

        const traceRender = trace((layout, data) => res.render(layout, data), 'render-page');
        traceRender(layout,
            {
                title,
                slots: slotsWithWidgetContent,
                modules: modulesWithContent,
                meta: { isDebug }
            }
        );

    } catch (err) {

        console.error(err.message);

        res.sendStatus(500);
    }
});

module.exports = app;
