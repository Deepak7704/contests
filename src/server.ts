import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import AuthenticationRoutes from './routes/AuthRoutes';
import ConversationRoutes from './routes/conversationRoutes';
import type { Response } from 'express';
import { userAuthenticationMiddleware, type AuthRequest } from './middleware/userAuthentiaction';
import { prisma } from '../lib/prisma';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/auth',AuthenticationRoutes);
app.use('/conversations',userAuthenticationMiddleware,ConversationRoutes);
app.get('/admin/analytics',userAuthenticationMiddleware,async(req:AuthRequest,res:Response)=>{
    if(req.user?.role != "ADMIN"){
        return res.status(400).json({
            error:"Unauthorized request"
        })
    }
    // results should be grouped by supervisor
   try{
        const results = await prisma.user.findMany({
        where:{
            role:"SUPERVISOR"
        },
        include:{
            agents:{
                include:{
                    agentConversation:{
                        where:{
                            status:"CLOSED"
                        }
                    }
                }
            }
        }
    });
    return res.status(200).json({
        results
    })
   }catch(error){
    console.error("Error while fetching analysis");
    return res.status(500).json({
        error:"Error while fetching the analysis"
    })
   }
});
app.listen(3000);