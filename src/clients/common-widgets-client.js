const axios = require('axios');

const {traceAsync} = require('@jahiduls/lib-tracing');

const fetchWidgetContent = async (uri) => {
    return axios.get(`http://${uri}`);
}

module.exports = {
    get: fetchWidgetContent,
    tracedGet: traceAsync(fetchWidgetContent, 'common-widgets-content-get')
}
