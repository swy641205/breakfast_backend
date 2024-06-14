import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { Router } from "express";
import type {
	Request,
	Response,
	NextFunction,
	ParamsDictionary,
} from "express-serve-static-core";
import nsUtil from "../nsUtil/nsUtil";

export const router = Router();

type Roles = 'admin' | 'guser' | 'it';

interface ReqBodyUser {
	email: string;
	username: string;
	password: string;
	roles: Roles[];
}
interface User extends ReqBodyUser {
	id: number;
	hashedPassword: string;
}

interface SignInUser {
	id: number;
	email: string;
	username: string;
}

const users: User[] = [];
const secret = process.env.JWT_SECRET || "mysecret";

router.post(
	"/register",
	async (
		req: Request<
			ParamsDictionary,
			{ message: string; users: User[] },
			ReqBodyUser
		>,
		res: Response,
	) => {
		const { email, username, password, roles } = req.body;
		const userIdx = users.findIndex((user) => user.email === email);
		if (userIdx >= 0) {
			return res.status(400).json({ message: "User already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		let id = users.length === 0 ? 0 : users[0].id;

		id =
			users.reduce((maxId, user, idx) => {
				return user.id > maxId ? user.id : maxId;
			}, id) + 1;

		const user: User = {
			id,
			email,
			username,
			password,
			hashedPassword,
			roles
		};

		// TODO in memory DB -> jsonDB -> MySQL
		users.push(user);
		console.log("users", users);

		res.status(201).json({ message: "User created", user });
	}
);


router.post('/login', async (req: Request, res: Response) => {
	const { email, password } = req.body;
	const userIdx = users.findIndex((user) => user.email === email);

	if (userIdx < 0) {
		return res.status(400).json({ message: "User not found" });
	}

	const user = users[userIdx];
	const isMatched = await bcrypt.compare(password, user.hashedPassword);

	if (!isMatched) {
		return res.status(400).json({ message: "Invalid credentials" });
	}

	const token = jwt.sign(
		{
			id: user.id,
			email: user.email,
			username: user.username,
			roles: user.roles
		},
		secret,
		{ expiresIn: "1h", }
	);

	res.status(200).json(token);
});


router.get('/profile', async (req: Request, res: Response) => {
	const token = req.headers.authorization;

	if (!token) {
		return res.status(401).json({ message: "Please login first" });
	}

	jwt.verify(token, secret, (err, payload) => {
		if (err) {
			return res.status(401).json({ message: "Invalid token" });
		}

		console.log('user:', payload);

		const user = payload as JwtPayload;
		const iat = (user.iat as number) * 1000;
		const exp = (user.exp as number) * 1000;

		res.json({
			message: 'jwt authorization success',
			user,
			iat: nsUtil.taipeiTimeString(new Date(iat)),
			exp: nsUtil.taipeiTimeString(new Date(exp)),
		});
	});
});


const jwtVerify = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Please login first" });
    }

    jwt.verify(token, secret, (err, payload) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }

        if (!payload.signInUser) {
            return res.status(403).json({ message: "Invalid payload" });
        }

        req.signInUser = payload.signInUser;
        next();
    });
}

router.get('/admin', jwtVerify, async (req: Request, res: Response) => {
    if (!req.signInUser.roles.includes('admin')) {
        return res.status(403).json({ message: "Permission denied" });
    }
    res.status(200).json({
        message: 'protected api executed', 
        signInUser: req.signInUser,
    });
});