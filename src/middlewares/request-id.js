module.exports = (req, res, next) => {
    const id = 'a-request-id';
    req.requestId = id;

    next();
};
