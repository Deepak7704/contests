import { Router } from "express";
import express from "express";
import type { AuthRequest } from "../middleware/userAuthentiaction";
import type { Response } from "express";
import { userLogin, userRegistration } from "../controller/handleAuthentication";
import { userAuthenticationMiddleware } from "../middleware/userAuthentiaction";
import { prisma } from "../../lib/prisma";
const router = express.Router();


router.post('/register',userRegistration)
router.post('/login',userLogin);
router.get('/me',userAuthenticationMiddleware, async(req:AuthRequest,res)=>{
    const userId = req.user?.userId;
    const reqAuth=req as AuthRequest
    if(!reqAuth.user){

    }
    const user = await prisma.user.findUnique({
        where:{id:userId},
        select:{
            id:true,
            name:true,
            email:true,
            role:true
        }
    })
})
export default router;