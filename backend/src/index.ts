import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import authRouter from "./routes/auth";
import gpsRouter from "./routes/gps";
import paymentRouter from "./routes/payment";

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", authRouter);
app.use("/api/gps", gpsRouter);
app.use("/api/payment", paymentRouter);

app.listen(port, () => {
  console.log(`V2X Auth backend listening on port ${port}`);
});

