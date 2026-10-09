import express from 'express'
import dotenv from 'dotenv'
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

app.use("/api/auth", AuthRoute);

const PORT = process.env.PORT

ConnectDB();

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})