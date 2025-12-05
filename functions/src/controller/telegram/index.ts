import express from "express";
import { verifyTelegramRequest } from "../../middlewares/verify-telegram-request";

const router = express.Router();

router.post("/telegram-webhook", verifyTelegramRequest)

export default router;