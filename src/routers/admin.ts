import { Router } from "express";
import type {
    Request,
    Response
} from "express-serve-static-core";
import { authenticate as Auth } from "../middleware/auth";
import { sendConflict, sendError, sendInternalError, sendNotFound, sendResponse } from "../nsUtil/responseHelper";
import { ADMIN } from "../config";
import { filterByDateRange } from "../nsUtil/nsUtil";
import tbl from "../mysql/general";

export const router = Router();

const tblMenu = tbl('menu');
const tblOrders = tbl('orders');
const tblUsers = tbl('users');

interface Order {
    id: number;
    total_price: string;
    order_time: string;
    pickup_time: string;
    method: string;
    note: string;
    order_items: string;
    status: string;
    user_id: number;
}


router.get("/menu/", Auth(ADMIN), async (req: Request, res: Response) => {
    const obj = await tblMenu.getAll();

    if (!obj) {
        return sendNotFound(res);
    }
    return sendResponse(res, obj);
});

router.get("/menu/:id", Auth(ADMIN), async (req: Request, res: Response) => {
    const id = req.params.id;
    const obj = await tblMenu.get('id', id);

    if (!obj) {
        return sendNotFound(res);
    }
    return sendResponse(res, obj);
});

router.get("/orders/:id", Auth(ADMIN), async (req: Request, res: Response) => {
    const id = req.params.id;
    const obj = await tblOrders.get('id', id);

    if (!obj) {
        return sendNotFound(res);
    }
    return sendResponse(res, obj);
});

router.get("/orders/", Auth(ADMIN), async (req: Request, res: Response) => {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const orders = await tblOrders.getAll();

    if (!orders) {
        return sendNotFound(res);
    }

    const filteredOrders = filterByDateRange(orders, startDate, endDate);
    return sendResponse(res, filteredOrders);
});

router.get("/users/", Auth(ADMIN), async (req: Request, res: Response) => {
    const email = req.query.email as string;
    if (email) {
        const obj = await tblUsers.get('email', email);
        if (!obj) {
            return sendNotFound(res);
        }
        return sendResponse(res, obj);
    }

    const obj = await tblUsers.getAll();

    if (!obj) {
        return sendNotFound(res);
    }
    return sendResponse(res, obj);
});

router.get("/users/:id", Auth(ADMIN), async (req: Request, res: Response) => {
    const id = req.params.id;
    const obj = await tblUsers.get('id', id);

    if (!obj) {
        return sendNotFound(res);
    }
    return sendResponse(res, obj);
});


router.post("/menu/", Auth(ADMIN), async (req: Request, res: Response) => {
    const { name, price, description } = req.body;
    if (!name || !price || !description) {
        return sendError(res, "name, price, description are required", 400);
    }
    const query = await tblMenu.get('name', name)
    if (query) {
        return sendConflict(res, `${name} already exists`);
    }

    const obj = await tblMenu.insert({ name, price, description });

    if (!obj) {
        return sendInternalError(res);
    }
    return sendResponse(res, obj);
});

router.put("/menu/:id", Auth(ADMIN), async (req: Request, res: Response) => {
    const id = req.params.id;
    const { name, price, description } = req.body;
    if (!name || !price || !description) {
        return sendError(res, "name, price, description are required", 400);
    }

    const query = await tblMenu.get('name', name)
    if (query) {
        return sendConflict(res, `${name} already exists`);
    }

    const obj = await tblMenu.upsert({ name, price, description });

    if (!obj) {
        return sendInternalError(res);
    }
    return sendResponse(res, obj);
});

router.delete("/menu/:id", Auth(ADMIN), async (req: Request, res: Response) => {
    const id = req.params.id;
    const obj = await tblMenu.delete('id', id);

    if (!obj) {
        return sendNotFound(res);
    }
    return sendResponse(res, obj);
});
