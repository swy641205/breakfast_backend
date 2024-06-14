import { Router } from "express";
import type { 
	Request, 
	Response,
	NextFunction,
	ParamsDictionary } from "express-serve-static-core";

export const router = Router();

router.get("/:id", (req: Request, res: Response) => {
	const output = {
		headers: req.headers,
		method: req.method,
		url: req.url,
		fullurl: req.originalUrl,
		params: req.params,
		query: req.query,
		timestamp: req.timestamp,
	};
	res.status(201).header("X-Custom-Header", "custom").
	json(output);
});

router.post("/:id", (req: Request, res: Response) => {
	const output = {
		headers: req.headers,
		method: req.method,
		params: req.params,
		query: req.query,
		body: req.body,
		timestamp: req.timestamp,
	};
	res.status(201).header("X-Custom-Header", "custom").
	json(output);
});
