import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from '../config';

export interface AuthenticatedRequest extends Request {
    user?: { roles: string[]; id: string; email: string; username: string };
}

export const authenticate = (requiredRoles: string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        let token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ message: "token not found", code: 401 });
        }
        token = token.split(' ')[1];
        const user = { roles: [], id: "", email: "", username: "" };

        try {
            const { roles, id, email, username } = await verifyToken(token, JWT_SECRET);
            user.roles = roles;
            user.id = id;
            user.email = email;
            user.username = username;
        } catch (err) {
            return res.status(401).json({ message: "Invalid token", code: 401 });
        }

        // store user info in request
        req.user = user;

        if (requiredRoles.length && !requiredRoles.some(role => user.roles.includes(role))) {
            return res.status(403).json({ message: "Permission denied", code: 403 });
        }

        next();
    };
};

interface CustomError {
    message: string;
    code: number;
}

const verifyToken = (token: string, secret: string): Promise<JwtPayload> => {
    return new Promise<JwtPayload>((resolve, reject) => {
        jwt.verify(token, secret, (err, payload) => {
            if (err) {
                reject({ message: "Invalid token", code: 401 } as CustomError);
            } else {
                resolve(payload as JwtPayload);
            }
        });
    });
};