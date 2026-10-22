const errorHandlerMiddleware = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong, please try again later' });
};

module.exports = errorHandlerMiddleware;

