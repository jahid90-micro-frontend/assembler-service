const axios = require('axios');

const {traceAsync} = require('@jahiduls/lib-tracing');

const uris = require('../config/uris');

const fetchPageMetadata = async (pageId) => {
    return axios.post(`http://${uris.PAGE_SERVICE_URI}`, { pageId });
}

module.exports = {
    get: fetchPageMetadata,
    tracedGet: traceAsync(fetchPageMetadata, 'page-service-metadata-get')
}
