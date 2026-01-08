import "dotenv/config";
import { prisma } from "../../lib/prisma";
import type { Response } from "express";
import { Status } from "../../generated/prisma";
import type { AuthRequest } from "../middleware/userAuthentiaction";
import { error } from "node:console";
import { stat } from "node:fs";

type Role = "ADMIN" | "SUPERVISOR" | "AGENT" | "CANDIDATE";

export const handleConversations = async(req:AuthRequest,res:Response)=>{
    //only candidate could create conversations. so we should check
    // whether the user we got was a candidate or not
    const supervisorId = req.body;
    if(!supervisorId){
        return res.status(400).json({
            error:"missing supervisorid"
        })
    }
    if(req.user?.role != "CANDIDATE"){
        return res.status(400).json({
            error:"Unauthorized request"
        });
    }
    //check whether the existing candidate already have conversation existing each candidate should only have one active/assigned conversation at a time

    try{
        const getConversation = await prisma.conversation.findFirst({
            where:{candidateId:req.user.userId}
        });
        if(getConversation?.status == 'OPEN' || getConversation?.status == 'CLOSED'){
            return res.status(409).json({
                error:"A conversation already exists"
            })
        }
        //create a new conversation
        const createConversation = await prisma.conversation.create({
            data:{
                candidateId:req.user.userId,
                supervisorId,
                status:'OPEN'
            }
        });
        return res.status(200).json({
            "success":true,
            "data":{
                "id":createConversation.id,
                "status":createConversation.status,
                "superviosrId":createConversation.supervisorId
            }
        })

    }catch(error){
        console.error("Error while creating a conversation");
        return res.status(500).json({
            error:"error while creating a conversation"
        })
    }

}
export const assignConversations = async(req:AuthRequest,res:Response)=>{
    const agentId = req.body.agentId;
    const conversationId = Number(req.params.id);
    if(!agentId || !conversationId){
        return res.status(400).json({
            error:"agentId and conversationId are required"
        })
    }
    // only supervisor agent can be able to assign conversations to agents
    if(req.user!.role != "SUPERVISOR"){
        return res.status(409).json({
            error:"Unauthorized request"
        })
    }
    // condition 1 => supervisor id should be same as agent.supervisorid
    try{
        //check the conversation status
        const conversationStatus = await prisma.conversation.findUnique({
            where:{id:conversationId},
            select:{
                status:true
            }
        });
        if(!conversationStatus){
            return res.status(400).json({
                error:"Conversation does not exists"
            });
        }
        if(conversationStatus.status === Status.ASSIGNED){
            return res.status(400).json({
                error:"Conversation is already assinged"
            });
        }
        //or if the status is OPENED OR CLOSED WE COULD ASSIGN AN AGENT
        const updatedConversation = await prisma.conversation.update({
            where:{id:conversationId,status:Status.ASSIGNED},
            data:{
                agentId,
                status:Status.OPEN
            }
        });
        return res.status(200).json({
            "success":true,
            "data":{
                "conversationId":updatedConversation.id,
                "agentId":updatedConversation.agentId,
                "supervisorId":updatedConversation.supervisorId
            }
        });
    }catch(error){
        console.error('Error while assigning the conversation to an agent');
        return res.status(400).json({
            error:"Error while assigning the conversation to an agent"
        })
    }
}
export const getConversations = async(req:AuthRequest,res:Response)=>{
    const conversationId = Number(req.params.id);
    if(!conversationId){
        return res.status(400).json({
            error:"Conversation id is missing"
        })
    }
    // now based up on  this conversation id 
    try{
        if(req.user?.role == "SUPERVISOR"){
            const conversations = await prisma.conversation.findUnique({
                where:{id:conversationId,supervisorId:req.user.userId}
            });
            if(!conversations){
                return res.status(400).json({
                    error:"Invalid request"
                })
            }
            return res.status(200).json({
                conversations
            })
        }
        if(req.user?.role == "AGENT"){
            const conversations = await prisma.conversation.findUnique({
                where:{id:conversationId,agentId:req.user.userId}
            });
            if(!conversations){
                return res.status(400).json({
                    error:"Invalid request"
                })
            }
            return res.status(200).json({
                conversations
            })
        }
        if(req.user?.role == "CANDIDATE"){
            const conversations = await prisma.conversation.findUnique({
                where:{id:conversationId,candidateId:req.user.userId}
            });
            if(!conversations){
                return res.status(400).json({
                    error:"Invalid request"
                })
            }
            return res.status(200).json({
                conversations
            })
        }
        const conversations = await prisma.conversation.findUnique({
            where:{id:conversationId}
        });
        if(!conversations){
            return res.status(400).json({
                error:"Conversation not found"
            });
        }
        return res.status(200).json({
            conversations
        });
    }catch(error){
        console.error("Error while fectchign the conversaions");
        res.status(500).json({
            error:"Error while fetching the conversations"
        })
    }
}
export const closeConversations = async(req:AuthRequest,res:Response) =>{
    const conversationId = Number(req.query.params);
    if(!conversationId){
        return res.status(400).json({
            error:"Conversation is a required field"
        })
    }
    if(req.user?.role !== "ADMIN" && req.user?.role !=="SUPERVISOR"){
        return res.status(409).json({
            error:"Unauthorized"
        })
    }
    try{
        const checkConversations = await prisma.conversation.findUnique({
            where:{id:conversationId},
        });
        // a conversation is closed is only when
        if(checkConversations?.status != "OPEN"){
            return res.status(400).json({
                error:"Request mismatch"
            })
        }
        if(req.user?.role === "SUPERVISOR"){
            const updateConverstaion = await prisma.conversation.update({
                where:{id:conversationId,supervisorId:req.user.userId},
                data:{
                    status:"CLOSED"
                }
            });
            if(!updateConverstaion){
                return res.status(409).json({
                    error:"Unauthorized"
                })
            }
        }
        const updateConverstaion = await prisma.conversation.update({
            where:{id:conversationId},
            data:{
                status:"CLOSED"
            }
        });
        return res.status(200).json({
            "data":{
                "conversatinoId" : updateConverstaion.id,
                "status": updateConverstaion.status
            }
        })
    }catch(error){
        console.error("Error while closing the conversations");
        return res.status(500).json({
            error:"Error while closing the conversations"
        })
    }
}
