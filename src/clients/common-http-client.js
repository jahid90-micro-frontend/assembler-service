const axios = require('axios');

const {traceAsync} = require('@jahiduls/lib-tracing');

const fetchContent = async (uri) => {
    return axios.get(`http://${uri}`, { timeout: 20 });
}

module.exports = {
    get: fetchContent,
    tracedGet: traceAsync(fetchContent, 'common-http--content--get')
}
