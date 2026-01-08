import 'dotenv/config';
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from 'express';


type Role = "ADMIN" | "SUPERVISOR" | "AGENT" | "CANDIDATE";
export interface AuthRequest extends Request {
    user?: {
        userId: number;
        role: Role;
    }
}

interface JWT_Payload extends JwtPayload {
    userId: number;
    role: Role
}
export const userAuthenticationMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'missing header'
            })
        }
        const token = header.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                error: 'missing token'
            })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWT_Payload;
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
}

