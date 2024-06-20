import exp from "constants";

export const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined');
    process.exit(1);
}

export const ADMIN = ['admin'];
export const MANAGER = [...ADMIN, 'owner'];
export const ROLES = [...MANAGER, 'member'];