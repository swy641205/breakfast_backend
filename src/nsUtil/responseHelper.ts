// src/utils/responseHelper.ts
import type { Response } from 'express';

export const sendResponse = (res: Response, data: unknown, message = "", code = 200) => {
    if (message) {
        return res.status(code).json({ data, message, code });
    }
    return res.status(code).json({ data, code });
};

export const sendError = (res: Response, message = "", code= 400) => {
    res.status(code).json({ message, code });
};

export const sendNotFound = (res: Response, message = "not found") => {
    res.status(404).json({ message, code: 404 });
}

export const sendInternalError = (res: Response, message = "internal server error") => {
    res.status(500).json({ message, code: 500 });
}

export const sendConflict = (res: Response, message = "conflict") => {
    res.status(409).json({ message, code: 409 });
}
    