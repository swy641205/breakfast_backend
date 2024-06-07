import { Express } from "express";

declare module "express-server-static-core" {
	export interface Request {
		timestamp: string;
		signInUser: SingInUser;
	}
}
