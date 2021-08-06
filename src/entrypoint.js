// Initialize telemetry
const { init } = require('@jahiduls/lib-tracing');
init();
console.info('Tracing initialized');

// Start the server
const server = require('./server');

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`server is up and running on port: ${port}`);
});
