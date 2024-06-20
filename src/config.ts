export const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined');
    process.exit(1);
}

export const ROLES = ['admin', 'owner', 'member'];
export const MANAGER = ['admin', 'owner'];
export const ADMIN = ['admin'];
