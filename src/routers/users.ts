import { Router } from "express";
import type {
	Request,
	Response,
	NextFunction,
	ParamsDictionary,
} from "express-serve-static-core";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import gmail, { type ILetter } from "../senderMail/gmail";

export const router = Router();

type Roles = 'admin' | 'member' | 'owner';

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
const secret = process.env.JWT_SECRET;

import tblUsers from "../mysql/users";

router.post('/verification', async (req: Request, res: Response) => {
	const { email } = req.body;

	if (!email) {
		return res.json({ message: "email is required", code: 400 });
	}
	const dbUser = await tblUsers.getByEmail(email);
	if (dbUser && dbUser.status === 'active') {
		return res.json({ message: `User email ${email} already exists`, code: 400 });
	}

	const rand6digit = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
	// const rand6digit = '012345';

	const letter: ILetter = {
		from: process.env.MAIL_SENDER as string,
		to: email,
		subject: 'Breakfast Order System Activation',
		html: `<h1>Activation code: ${rand6digit}</h1>`
	}
	const info = await gmail.send(letter);
	console.log('activation mail has send!', info);
	const user = {
		email: email,
		activation_secret: rand6digit,
		status: 'in-active'

	}
	const rs = await tblUsers.upsert(user);
	if (rs) {
		res.status(200).json({ message: "mail sended!", code: 200});
	} else {
		console.log("rs", rs)
		res.status(500).json({ message: "mail store failed", code: 500 });
	}
});

interface IRequestMemberBody {
	email: string;
	activation_secret: string;
	password: string;
	confirm_password: string;
	username: string;
	phone: string;
}

router.post("/register", async (req: Request, res: Response,) => {
	const { email, activation_secret, password, confirm_password, username, phone }: IRequestMemberBody = req.body;

	if (!email || !activation_secret || !username || !password || !phone) {
		return res.status(400).json({ message: "fields are not correct." });
	}

	const dbUser = await tblUsers.getByEmail(email);
	if (dbUser.status === 'active') {
		return res.status(400).json({ message: `User email ${email} already exists` });
	}

	if (dbUser.activation_secret !== activation_secret) {
		return res.status(400).json({ message: "Activation secret is not correct", secret_incorrect: true });
	}

	const hashed_password = await bcrypt.hash(password, 10);
	// properites is unordered
	const user = {
		email,
		username,
		hashed_password,
		phone: phone,
		status: 'active',
		roles: 'member',
	};
	console.log("user", user);

	const rs = await tblUsers.upsert(user);
	if (rs) {
		res.status(201).json({ message: "User created", users: { id: rs.insertedId, ...user } });
	} else {
		console.log("rs", rs)
		res.status(500).json({ message: "User create failed" });
	}
});

router.post('/login', async (req: Request, res: Response) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json({ message: "email, password are required" });
	}

	const user = await tblUsers.getByEmail(email);
	if (!user) {
		return res.status(400).json({ message: `User email ${email} not exists`, code: 400 });
	}
	const rolesList = user.roles.split(',');

	const isMatched = await bcrypt.compare(password, user.hashed_password);
	if (!isMatched) {
		return res.status(400).json({ message: "密碼錯誤", code: 400 });
	}

	const token = jwt.sign(
		{
			id: user.id,
			email: user.email,
			username: user.username,
			roles: user.roles
		},
		secret,
		{ expiresIn: "999d", }
	);
	const info = {
		token: token,
		email: user.email,
		username: user.username,
		roles: rolesList,
	}

	res.status(200).json({ data: info, code: 200});
});

const verifyToken = (token, secret) => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, secret, (err, payload) => {
			if (err) {
				reject({ message: "Invalid token", code: 401 });
			} else {
				resolve(payload);
			}
		});
	});
};

router.get('/profile', async (req: Request, res: Response) => {
	let token = req.headers.authorization;

	if (!token) {
		return res.status(401).json({ message: "Please login first", code: 401 });
	}
	token = token.split(' ')[1];
	const { email } = await verifyToken(token, secret);
	const user = await tblUsers.getByEmail(email);
	console.log('user', user);
	const data = {
		email: user.email,
		username: user.username,
		phone: user.phone,
	}
	res.json({ data: data, code: 200 });
});

router.put('/profile', async (req: Request, res: Response) => {
	let token = req.headers.authorization;

	if (!token) {
		return res.status(401).json({ message: "Please login first", code: 401 });
	}
	token = token.split(' ')[1];
	const { email } = await verifyToken(token, secret);
	if (!email) {
		return res.status(401).json({ message: "db error", code: 401 });
	}
	console.log('req.body', req.body);

	const hashed_password = await bcrypt.hash(req.body.password, 10);
	const user = {
		email: email,
		username: req.body.username,
		hashed_password: hashed_password,
		phone: req.body.phone
	};
	const r = await tblUsers.upsert(user)
	if (r) {
		res.json({ message: 'done!', code: 200 });
	} else {
		res.status(500).json({ message: 'db error', code: 500 });
	}

});

export default verifyToken;