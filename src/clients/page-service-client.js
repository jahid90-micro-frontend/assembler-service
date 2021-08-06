const axios = require('axios');

const uris = require('../config/uris');

const fetchPageMetadata = async (pageId) => {
    console.debug(pageId);
    return axios.post(`http://${uris.PAGE_SERVICE_URI}`, { pageId });
}

module.exports = {
    get: fetchPageMetadata
}
