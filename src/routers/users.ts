import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

import gmail, { type ILetter } from "../senderMail/gmail";

import { Router } from "express";
import type {
	Request,
	Response,
	NextFunction,
	ParamsDictionary,
} from "express-serve-static-core";
import nsUtil from "../nsUtil/nsUtil";

export const router = Router();

type Roles = 'admin' | 'guser' | 'it' | 'member' | 'manager' | 'account';

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

import tblUsers from "../mysql/users";
import type { IUserLogin, IUserRegister, IUserNoId, IUser } from "../mysql/users";

router.get('/create', async (req: Request, res: Response) => {
	const rs = await tblUsers.create();
	console.log(rs);
	if (rs === null) {
		res.status(500).json({ error: `DB table ${tblUsers.tblName} create failed` });
	} else {
		res.status(200).json(rs);
	}
});

router.get('/drop', async (req: Request, res: Response) => {
	const rs = await tblUsers.drop();
	if (rs === null) {
		res.status(500).json({ error: `DB table ${tblUsers.tblName} drop failed` });
	} else {
		res.status(200).json(rs);
	}
});

router.get('/clear', async (req: Request, res: Response) => {
	const rs = await tblUsers.clear();
	console.log(rs);
	if (rs === null) {
		res.status(500).json({ error: `DB table ${tblUsers.tblName} clear failed` });
	} else {
		res.status(200).json(rs);
	}
});

router.post(
	"/register",
	async (
		req: Request<
			ParamsDictionary,
			{ message: string; users: IUser },
			IUserRegister
		>,
		res: Response,
	) => {
		const { email, name, password, roles } = req.body;

		if (!email || !name || !password || !roles) {
			return res.status(400).json({ message: "email, name password, roles are required." });
		}

		const dbUser = await tblUsers.getByEmail(email);
		if (dbUser) {
			return res.status(400).json({ message: `User email ${email} already exists` });
		}

		const hashed_password = await bcrypt.hash(password, 10);
		
		const rand6digit = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

		const letter: ILetter = {
			from: process.env.MAIL_SENDER as string,
			to: email,
			subject: `${name} Activation`,
			html: `<h1>Activation code: ${rand6digit}</h1>`
		}
		const info = await gmail.send(letter);
		console.log('activation mail has send!', info);

		const user: IUserNoId = {
			email,
			name,
			password,
			hashed_password,
			roles,
			activation_secret: rand6digit,
			status: 'in-active',
		};
		console.log("user", user);

		const rs = await tblUsers.insert([user]);
		if ( rs ) {
			res.status(201).json({ message: "User created", users: {id: rs.insertedId, ... user}});
		} else {
			console.log("rs", rs)
			res.status(500).json({ message: "User create failed" });
		}
		console.log("users", users);
	}
);


router.post('/login', async (req: Request, res: Response) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json({ message: "email, password are required" });
	}

	const user = await tblUsers.getByEmail(email);


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



router.get('/getSchema', async (req: Request, res: Response) => {
	// const rs = await tblUsers.getSchema();
	// if (rs === null) {
	// 	res.status(500).json({ error: `DB table ${tblUsers.tblName} schema get failed` });
	// } else {
	// 	res.status(200).json(rs);
	// }
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