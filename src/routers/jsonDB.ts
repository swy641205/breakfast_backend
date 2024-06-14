import { Router } from "express";
import type { Request, Response } from "express";

export const router = Router();

const baseUrl = "http://localhost:3300/users";
router.get("/users", async (req: Request, res: Response) => {
    const result = await fetch(baseUrl);
    const users = await result.json();
    const output = {
        users,
    };
    res.status(201).header("X-JsonServer-Header", "Get all users").json(output);
});


router.post("/users", async (req: Request, res: Response) => {
    const result = await fetch(baseUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
    });
    const users = await result.json();
    const output = {
        users,
        bosy: req.body,
    };
    res.status(201).header("X-JsonServer-Header", "Create a user").json(output);
});
