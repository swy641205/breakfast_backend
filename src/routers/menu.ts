import { Router } from "express";
import type {
    Request,
    Response
} from "express-serve-static-core";
import { JWT_SECRET } from '../config';
import verifyToken from "../routers/users";
import tbl from "../mysql/general";

export const router = Router();

const tblMenu = tbl('menu');

router.get("/:id", async (req: Request, res: Response) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Please login first", code: 401 });
    }
    token = token.split(' ')[1];
    try {
        const payload = await verifyToken(token, JWT_SECRET);
    } catch (err) {
        return res.json(err);
    }

    const id = req.params.id;
    const menu = await tblMenu.get('id', id);
    if (menu) {
        res.json({ data: menu, code: 200 });
    } else {
        res.json({ error: "menu not found", code: 404 });
    }
});

router.get("/", async (req: Request, res: Response) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Please login first", code: 401 });
    }
    token = token.split(' ')[1];
    try {
        const payload = await verifyToken(token, JWT_SECRET);
    } catch (err) {
        return res.json(err);
    }

    const id = req.params.id;
    const menuAll = await tblMenu.getAll();
    if (menuAll) {
        res.json({ data: menuAll, code: 200 });
    } else {
        res.json({ error: "menu not found", code: 404 });
    }
});

router.post("/", async (req: Request, res: Response) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Please login first", code: 401 });
    }
    token = token.split(' ')[1];
    const { roles } = await verifyToken(token, JWT_SECRET);
    if (!roles.includes('admin' || 'owner')) {
        return res.status(401).json({ message: "permission deny", code: 403 });
    }

    const { name, description, price, tag } = req.body;

    if (!name || !description || !price || !tag) {
        return res.json({ error: "name, description, price, tag are required", code: 400 });
    }

    const menuName = await tblMenu.get('name', name)
    if (menuName) {
        return res.json({ error: `${name} already exists`, code: 400 });
    }

    const rs = await tblMenu.insert({
        name,
        description,
        price,
        tag
    });
    if (rs) {
        res.json({ id: rs.insertedId, code: 201 });
    } else {
        res.json({ error: "insert failed", code: 500 });
    }
});

router.put("/:id", async (req: Request, res: Response) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Please login first", code: 401 });
    }
    token = token.split(' ')[1];
    const { roles } = await verifyToken(token, JWT_SECRET);
    if (!roles.includes('admin' || 'owner')) {
        return res.status(401).json({ message: "permission deny", code: 403 });
    }

    const { name, description, price, tag } = req.body;

    if (!name || !description || !price || !tag) {
        return res.json({ error: "name, description, price, tag are required", code: 400 });
    }
    const id = req.params.id;
    const menuName = await tblMenu.get('id', id)
    if (!menuName) {
        return res.json({ error: `${name} not exists`, code: 400 });
    }

    const rs = await tblMenu.upsert({
        id,
        name,
        description,
        price,
        tag
    });
    if (rs) {
        res.json({ id: rs.upsertedId, code: 201 });
    } else {
        res.json({ error: "upsert failed", code: 500 });
    }
});

router.delete("/:id", async (req: Request, res: Response) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Please login first", code: 401 });
    }
    token = token.split(' ')[1];
    const { roles } = await verifyToken(token, JWT_SECRET);
    if (!roles.includes('admin' || 'owner')) {
        return res.status(401).json({ message: "permission deny", code: 403 });
    }

    const rs = await tblMenu.delete('id', req.params.id);
    if (rs) {
        res.json({ code: 200 });
    } else {
        res.json({ error: "delete failed", code: 500 });
    }
});
