function checkUserId(req, res, next) {
    const userId = parseInt(req.query.user);
    if (isNaN(userId) || userId < 1 || userId > 1000) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
    }
    req.userId = userId;
    next();
}

module.exports = checkUserId;