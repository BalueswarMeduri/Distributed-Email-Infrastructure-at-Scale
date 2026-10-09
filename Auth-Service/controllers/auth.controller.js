import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        const accesstoken = jwt.sign({
            id: newUser._id
        }, process.env.JWT_SECRET, {
            expiresIn: "15m"
        });

        const refreshtoken = jwt.sign({
            id: newUser._id
        }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.cookie("refreshtoken", refreshtoken, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production"
        });

        return res.status(201).json({
            message: "User registered successfully",
            accesstoken,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error while registering user",
            error: error.message
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        const accesstoken = jwt.sign({
            id: user._id
        }, process.env.JWT_SECRET, {
            expiresIn: "15m"
        });

        const refreshtoken = jwt.sign({
            id: user._id
        }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.cookie("refreshtoken", refreshtoken, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production"
        });

        return res.status(200).json({
            message: "Login successful",
            accesstoken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error while logging in",
            error: error.message
        });
    }
};

export const logoutUser = async (req, res) => {
    try {
        res.clearCookie("refreshtoken", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production"
        });

        return res.status(200).json({
            message: "Logged out successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error while logging out",
            error: error.message
        });
    }
};