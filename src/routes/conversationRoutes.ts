import { Router } from "express";
import express from 'express';
import { handleConversations,assignConversations,getConversations,closeConversations } from "../controller/handleConversations";
const router = express.Router();

router.post("/",handleConversations);
router.post("/:id/assign",assignConversations);
router.get("/:id",getConversations);
router.post("/:id/close",closeConversations);
export default router;