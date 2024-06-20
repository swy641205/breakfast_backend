import { Router } from "express";
import type {
    Request,
    Response
} from "express-serve-static-core";

export const router = Router();

const secret = process.env.JWT_SECRET;

import verifyToken from "./users";
import tbl from "../mysql/general";

const tblOrders = tbl('orders');

router.get("/:id", async (req: Request, res: Response) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Please login first", code: 401 });
    }
    token = token.split(' ')[1];
    const user = { roles: null, id: null};
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

router.get("/", async (req: Request, res: Response) => {
    let token = req.headers.authorization;
    const self = req.query.self;

    if (!token) {
        return res.status(401).json({ message: "Please login first", code: 401 });
    }
    token = token.split(' ')[1];
    const user = { roles: null, id: null};
    try {
        const { roles, id } = await verifyToken(token, secret);
        user.roles = roles;
        user.id = id;
    } catch (err) {
        return res.json(err);
    }

    const id = req.params.id;
    const orders = await tblOrders.getAll();
    if (!orders) {
        res.json({ error: "orders not found", code: 404 });
    }
    if (self) {
        const selfOrders = orders.filter(order => order.user_id === user.id);
        res.json({ data: selfOrders, code: 200 });
    } else if (user.roles.includes('admin' || 'owner')) {
        res.json({ data: orders, code: 200 });
    } else {
        res.json({ error: "permission deny", code: 403 });
    }
});

// TODO price should count in backend
router.post("/", async (req: Request, res: Response) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Please login first", code: 401 });
    }
    token = token.split(' ')[1];
    await verifyToken(token, secret);


    const { order_items, total_price, order_time, pickup_time, method, note, user } = req.body;

    if (!order_items || !total_price || !order_time || !method || !pickup_time || !user) {
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
        });

        if (!orderResult || !orderResult.insertedId) {
            return res.json({ error: "Failed to insert order", code: 500 });
        }

        const orderId = orderResult.insertedId;

        res.json({ id: orderId, message: "Order submitted successfully", code: 201 });
    } catch (error) {
        console.error("Error submitting order:", error);
        res.json({ error: "Failed to submit order", code: 500 });
    }
});

router.put("/:id", async (req: Request, res: Response) => {
    const id = req.params.id;
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Please login first", code: 401 });
    }
    token = token.split(' ')[1];
    await verifyToken(token, secret);


    const { order_items, total_price, order_time, pickup_time, method, note, status, user } = req.body;

    if (!order_items || !total_price || !order_time || !method || !pickup_time || !status || !user) {
        return res.json({ error: "Required fields are missing", code: 400 });
    }

    const orderId = await tblOrders.get('id', id)
    if (!orderId) {
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
