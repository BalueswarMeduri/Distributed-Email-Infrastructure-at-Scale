import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import ConnectDB from './Config/DB.js';
import cors from 'cors';
import AuthRoute from './routes/auth.route.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: true,
    credentials: true
}));

// Route handler for both gateway-proxied and direct routes
app.use("/api/auth", AuthRoute);
app.use("/", AuthRoute);

const PORT = process.env.PORT || 5001;

ConnectDB();

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});