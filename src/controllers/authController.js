const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const config = require("../config/config");

let refreshTokens = [];

const registerUser = async (req, res) => {
    try {

        const existUserID = await User.findOne({ userID: req.body.userID });
        if (existUserID) {
          return res.status(400).json({ error: 'Mã người vận hành đã tồn tại' });
        }

        const existEmail = await User.findOne({ email: req.body.email });
        if (existEmail) {
          return res.status(400).json({ error: 'Email đã tồn tại' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(req.body.password, salt);

        // Create new user
        const newUser = new User({
            userID: req.body.userID,
            email: req.body.email,
            password: hashed,
            name: req.body.name,
            department: req.body.department
        });

        //Save to DB
        const user = await newUser.save();
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
};

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            isAdmin: user.isAdmin,
        },
        config.JWT_ACCESS_KEY,
        { expiresIn: "3d" },
    );
}

const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            isAdmin: user.isAdmin,
        },
        config.JWT_REFRESH_KEY,
        { expiresIn: "365d" },
    );
}

const loginUser = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json("Wrong Email");
        }
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(404).json("Wrong Password");
        }
        if (user && validPassword) {
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);
            refreshTokens.push(refreshToken);
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false,
                path: "/",
                sameSite: "strict"
            });
            const { password, ...others } = user._doc;
            return res.status(200).json({ ...others, accessToken });
        }
    } catch (err) {
        return res.status(500).json(err.message);
    }
}

const requestRefreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json("You are not authenticated!");
    }
    if (!refreshTokens.includes(refreshToken)) {
        return res.status(403).json("Refresh token is not valid!");
    }
    jwt.verify(refreshToken, config.JWT_REFRESH_KEY, (err, user) => {
        if (err) {
            console.log(err);
        }
        refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.push(newRefreshToken);
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: false,
            path: "/",
            sameSite: "strict"
        });
        return res.status(200).json({ accessToken: newAccessToken });
    })
}

const logoutUser = async (req, res) => {
    try {
        res.clearCookie("refreshToken");
        refreshTokens = refreshTokens.filter((token) => token !== req.cookies.refreshToken);
        return res.status(200).json("Logged out succesfully!");
    } catch (error) {
        return res.status(500).json(error);
    }
}

const changePassword = async (req, res) => {
    try {
        const id = req.params.id;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(id);

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        const changePSW = await User.findByIdAndUpdate(id, { $set: { password: hashedNewPassword } }, { new: true } ); 
        res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        return res.status(500).json(err);
    }
}

module.exports = { registerUser, loginUser, requestRefreshToken, logoutUser, changePassword };