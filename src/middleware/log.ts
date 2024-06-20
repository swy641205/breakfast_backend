import type { Request, Response, NextFunction } from 'express';

const logger = (req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.timestamp}: ${req.ip} ${req.method} ${req.originalUrl}`);
    next();
}

export default logger;