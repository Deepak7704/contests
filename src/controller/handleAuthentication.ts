import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import jwt from "jsonwebtoken";
import type { Request,Response } from "express";
import type{ AuthRequest } from "../middleware/userAuthentiaction";


export const userRegistration = async(req:AuthRequest,res:Response) => {
    try{
        const { email,name,passsword,role,supervisorId } = req.body;
        if(!email || !name || !passsword || !role){
            return res.status(400).json({
                error:'Email, Name and password are required fields'
            });
        }
        if(role === 'AGENT' && !supervisorId){
            return res.status(400).json({
                success:false,
                error:"SupervisorId is required for agent role"
            });
        }
        const isExistingUser = await prisma.user.findUnique({
            where:{email}
        })
        if(isExistingUser){
            return res.status(409).json({
                error:'User already exists'
            })
        }
        const hashedPassword = await bcrypt.hash(passsword,10);
        const user = await prisma.user.create({
            data:{
                email,
                name,
                password:hashedPassword,
                role,
                ...(role === "AGENT" && {supervisorId})
            }
        })
        const token = jwt.sign(
            {userId:user.id,role:user.role},
            process.env.JWT_SECRET as string,
            {expiresIn:'24h'}
        )
        res.status(200).json({
            "sucess":true,
            "data":{
                "_id":user.id,
                "name":user.name,
                "email":user.email,
                "role":user.role
            }
        })
    }catch(error){
        console.error('Error while user registration',error);
        return res.status(500).json({
            error:'Error while user Registration'
        })
    }
}
export const userLogin = async(req:AuthRequest,res:Response)=>{
    try{
        const { email,passsword } = req.body;
        if(!email || !passsword){
            return res.status(400).json({
                error:'Email and password are required fields'
            })
        }
        const verifyUser = await prisma.user.findUnique({
            where:{email}
        });
        if(!verifyUser){
            return res.status(401).json({
                error:'Invalid credentials'
            })
        }
        const verfiyUserPassword = await bcrypt.compare(verifyUser.password,passsword);
        if(!verfiyUserPassword){
            return res.status(401).json({
                error:"Invalid credentails"
            })
        }
        const token = jwt.sign(
            {userId:verifyUser.id,role:verifyUser.role},
            process.env.JWT_SECRET as string,
            {expiresIn:'24h'}
        );
        return res.status(200).json({
            "sucess":"true",
            "data":{
                "token":token
            }
        })

    }catch(error){
        console.error('Erro while user login',error);
        return res.status(500).json({
            error:'Error while user login'
        })
    }
}
