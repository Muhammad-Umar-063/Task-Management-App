import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import AuthRoutes from "./Routes/AuthRoutes.js";

const app = express();
const router = express.Router();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/auth", AuthRoutes);
app.listen(3000, () => console.log("Server running on port 3000"));
