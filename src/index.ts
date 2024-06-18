import express from "express";
import type { Request, Response, NextFunction } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

import { createServer } from 'node:http';
const httpServer = createServer(app);

httpServer.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

import cors from "cors";
app.use(
	cors({
		origin: "*",
	}),
);

import addTime from "./middleware/time";
app.use(addTime);

import logger from "./middleware/log";
app.use(logger);


import path from "node:path";
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { router as sampleRouter } from "./routers/sample";
app.use("/api/sample", sampleRouter);

import { router as usersRouter } from "./routers/users";
app.use("/api/users", usersRouter);

import { router as menuRouter } from "./routers/menu";
app.use("/api/menu", menuRouter);

app.get("/api", (req: Request, res: Response) => {
	res.send("root api");
});
