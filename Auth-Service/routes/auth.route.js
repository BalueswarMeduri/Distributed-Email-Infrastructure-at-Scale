import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/auth.controller.js";

const AuthRoute = express.Router();

AuthRoute.post('/register', registerUser);
AuthRoute.post('/login', loginUser);
AuthRoute.post('/logout', logoutUser);

export default AuthRoute;