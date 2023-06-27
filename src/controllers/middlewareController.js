const jwt = require("jsonwebtoken");
const config = require("../config/config");
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const token = req.headers.token;
    if (token) {
        const accessToken = token.split(" ")[1];
        jwt.verify(accessToken, config.JWT_ACCESS_KEY, (err, user) => {
            if (err) {
                return res.status(401).json("Token is not valid!");
            }
            req.user = user;
            next();
        })
    }
    else {
        return res.status(401).json("You are not authenticated!");
    }
}

const verifyTokenAdminAuth = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next();
        } else {
            return res.status(403).json("Access denied. Not authorized!")
        }
    })
}

module.exports = { verifyToken, verifyTokenAdminAuth };