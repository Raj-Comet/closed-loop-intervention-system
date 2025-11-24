import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

let io;
const socketMap = new Map(); // Maps student_id to socket.id

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    socket.on('student:register', (studentId) => {
      socketMap.set(studentId, socket.id);
      socket.join(`student:${studentId}`);
      console.log(`Student ${studentId} registered to socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      // Remove student from map
      for (const [studentId, socketId] of socketMap.entries()) {
        if (socketId === socket.id) {
          socketMap.delete(studentId);
          console.log(`Student ${studentId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
};

export const getIO = () => io;

export const emitToStudent = (studentId, event, data) => {
  if (io) {
    io.to(`student:${studentId}`).emit(event, data);
  }
};
