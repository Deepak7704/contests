import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import AuthenticationRoutes from './routes/AuthRoutes';
import ConversationRoutes from './routes/conversationRoutes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/auth',AuthenticationRoutes);
app.use('/conversations',ConversationRoutes);
app.listen(3000);