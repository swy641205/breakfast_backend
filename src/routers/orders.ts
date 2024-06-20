import { Router } from "express";
import type {
    Request,
    Response
} from "express-serve-static-core";
import { sendError, sendInternalError, sendNotFound, sendResponse } from "../nsUtil/responseHelper";
import { authenticate as Auth } from "../middleware/auth";
import verifyToken from "./users";
import tbl from "../mysql/general";
import { MANAGER, ROLES } from "../config";
import { filterByDateRange } from "../nsUtil/nsUtil";
import { send } from "process";

export const router = Router();

const secret = process.env.JWT_SECRET;

const tblOrders = tbl('orders');


// TODO price should count in backend
router.post("/", Auth(ROLES), async (req: Request, res: Response) => {
    const { order_items, total_price, order_time, pickup_time, method, note } = req.body;
    const userId = req.user.id;

    if (!order_items || !total_price || !order_time || !method || !pickup_time) {
        return res.json({ error: "Required fields are missing", code: 400 });
    }

    const orderItemsStr = JSON.stringify(order_items);
    try {
        // 插入訂單資料到 orders 表
        const orderResult = await tblOrders.insert({
            total_price,
            order_items: orderItemsStr,
            order_time,
            pickup_time,
            method,
            note,
            status: 'pending',
            user_id: userId,
        });

        if (!orderResult || !orderResult.insertedId) {
            return sendInternalError(res, "Failed to insert order");
        }

        const orderId = orderResult.insertedId;

        return sendResponse(res, orderId, "Order submitted successfully", 201);
    } catch (error) {
        console.error("Error submitting order:", error);
        return sendInternalError(res, "Failed to submit order");
    }
});

router.get("/", Auth(ROLES), async (req: Request, res: Response) => {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const orders = await tblOrders.getAll();

    if (!orders) {
        return sendNotFound(res);
    }
    const selfOrder = orders.filter(
        order => order.user_id === req.user.id
    );
    const filteredOrders = filterByDateRange(
        selfOrder, startDate, endDate
    );
    return sendResponse(res, filteredOrders);
});

router.get("/:id", async (req: Request, res: Response) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Please login first", code: 401 });
    }
    token = token.split(' ')[1];
    const user = { roles: null, id: null };
    try {
        const { roles, id } = await verifyToken(token, secret);
        user.roles = roles;
        user.id = id;
    } catch (err) {
        return res.json(err);
    }

    const id = req.params.id;
    const order = await tblOrders.get('id', id);
    if (!order) {
        res.json({ error: `${id} not found`, code: 404 });
    }
    if (user.roles.includes('admin' || 'owner')) {
        res.json({ data: order, code: 200 });
    } else if (user.id === order.user_id) {
        res.json({ data: order, code: 200 });
    } else {
        res.json({ error: "permission deny", code: 403 });
    }
});

router.put("/:id", Auth(MANAGER), async (req: Request, res: Response) => {
    const id = req.params.id;
    const { order_items, total_price, order_time, pickup_time, method, note, status } = req.body;

    if (!order_items || !total_price || !order_time || !method || !pickup_time || !status) {
        return res.json({ message: "Required fields are missing", code: 400 });
    }

    const order = await tblOrders.get('id', id)
    if (!order) {
        return res.json({ error: `${id} not exists`, code: 400 });
    }

    const orderItemsStr = JSON.stringify(order_items);
    try {
        // upsert訂單資料到 orders 表
        const orderResult = await tblOrders.upsert({
            id,
            total_price,
            order_items: orderItemsStr,
            order_time,
            pickup_time,
            method,
            note,
            status,
            user_id: order.user_id,
        });

        if (!orderResult) {
            return res.json({ error: "Failed to upsert order", code: 500 });
        }
        res.json({ message: "Order update successfully", code: 201 });
    } catch (error) {
        console.error("Error updating order:", error);
        res.json({ error: "Failed to updating order", code: 500 });
    }
});

router.delete("/:id", async (req: Request, res: Response) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Please login first", code: 401 });
    }
    token = token.split(' ')[1];
    const { roles } = await verifyToken(token, secret);
    if (!roles.includes('admin' || 'owner')) {
        return res.status(401).json({ message: "permission deny", code: 403 });
    }

    const rs = await tblOrders.delete('id', req.params.id);
    if (rs) {
        res.json({ code: 200 });
    } else {
        res.json({ error: "delete failed", code: 500 });
    }
});

export default router;
