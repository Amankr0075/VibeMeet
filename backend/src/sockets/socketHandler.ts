import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import MatchSession from '../models/MatchSession';
import CallSession from '../models/CallSession';
import { moderateText } from '../ai/moderationService';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

const normalizedInstitution = (institutionName?: string): string =>
  (institutionName || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const wantsSameCollegeMatch = (user: any): boolean =>
  user.preferredCommunity === 'COLLEGE_STUDENTS';

const isSameCollegeStudent = (user: any, potentialUser: any): boolean =>
  user.isCollegeStudent === true &&
  potentialUser.isCollegeStudent === true &&
  Boolean(normalizedInstitution(user.institutionName)) &&
  normalizedInstitution(user.institutionName) === normalizedInstitution(potentialUser.institutionName);

// ── Online user tracking ──────────────────────────────────────────────────────
// Map of userId → Set of socketIds (a user may have multiple tabs open)
export const onlineUsers = new Map<string, Set<string>>();

const addOnlineUser = (userId: string, socketId: string) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId)!.add(socketId);
};

const removeOnlineUser = (userId: string, socketId: string) => {
  const sockets = onlineUsers.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) onlineUsers.delete(userId);
  }
};

export const getOnlineUserIds = (): string[] => Array.from(onlineUsers.keys());
export const getOnlineCount = (): number => onlineUsers.size;

let ioInstance: Server | null = null;
export const getIo = () => ioInstance;

// Matching is a read-then-write operation. Without a lock, two users joining at
// the same time can both search an empty queue and then both insert themselves,
// leaving neither request to search again. Serialize admissions so the second
// request always sees the first waiting user.
let queueOperation: Promise<void> = Promise.resolve();

const runQueueOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
  const previousOperation = queueOperation;
  let release!: () => void;
  queueOperation = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previousOperation;
  try {
    return await operation();
  } finally {
    release();
  }
};

export const setupSockets = (io: Server) => {
  ioInstance = io;
  // Middleware to authenticate socket
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
      socket.userId = decoded.userId;
      
      const user = await User.findById(decoded.userId);
      if (!user) return next(new Error('User not found'));
      
      if (user.accountStatus === 'BANNED' || user.accountStatus === 'AI_BLOCKED' || user.accountStatus === 'SUSPENDED') {
        return next(new Error('Account restricted'));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${socket.user?.username} (${socket.id})`);

    // Track online user and broadcast live count
    addOnlineUser(userId, socket.id);
    io.emit('online-count', getOnlineCount());

    socket.on('join-match-queue', async () => {
      try {
        await runQueueOperation(async () => {
          // Reload the profile so preference changes made without reconnecting
          // are immediately used for matching.
          const user = await User.findById(userId);
          if (!user) return;

          // Remove any old entry for this user before looking for a partner.
          await MatchSession.findOneAndDelete({ user: userId });

          const queue = await MatchSession.find({ status: 'QUEUED' }).populate('user');
          let matchedSession: (typeof queue)[number] | null = null;

          for (const potential of queue) {
            const pUser = potential.user as any;
            const waitingSocket = io.sockets.sockets.get(potential.socketId);

            // A disconnect normally removes this record, but discard stale
            // entries here too so they can never block a real user.
            if (!pUser || !waitingSocket) {
              await MatchSession.findByIdAndDelete(potential._id);
              continue;
            }

            const userPrefersPotential = user.preferredGender === 'Everyone' || (user.preferredGender === 'Men' && pUser.gender === 'Male') || (user.preferredGender === 'Women' && pUser.gender === 'Female');
            const potentialPrefersUser = pUser.preferredGender === 'Everyone' || (pUser.preferredGender === 'Men' && user.gender === 'Male') || (pUser.preferredGender === 'Women' && user.gender === 'Female');
            const userCommunityMatch = !wantsSameCollegeMatch(user) || isSameCollegeStudent(user, pUser);
            const potentialCommunityMatch = !wantsSameCollegeMatch(pUser) || isSameCollegeStudent(pUser, user);

            if (userPrefersPotential && potentialPrefersUser && userCommunityMatch && potentialCommunityMatch) {
              matchedSession = potential;
              break;
            }
          }

          if (matchedSession) {
            // Claim and remove the waiting record while the queue is locked.
            // Removing it also avoids leaving permanent MATCHED rows behind.
            await MatchSession.findByIdAndDelete(matchedSession._id);

            const callSession = new CallSession({
              userA: matchedSession.user._id,
              userB: userId,
              status: 'ACTIVE'
            });
            await callSession.save();

            // Notify both
            const roomId = callSession._id.toString();
            socket.join(roomId);
            io.sockets.sockets.get(matchedSession.socketId)?.join(roomId);

            io.to(roomId).emit('match-found', { roomId, callSession });

            // Initiator will be the one who was waiting in the queue
            io.to(matchedSession.socketId).emit('initiate-call', { roomId });
          } else {
            await MatchSession.create({ user: userId, socketId: socket.id, status: 'QUEUED' });
          }
        });

      } catch (err) {
        console.error('Match Queue Error:', err);
      }
    });

    socket.on('leave-match-queue', async () => {
      await MatchSession.findOneAndDelete({ user: userId });
    });

    // WebRTC Signaling
    socket.on('call-offer', (data: { offer: any, roomId: string }) => {
      socket.to(data.roomId).emit('call-offer', { offer: data.offer, roomId: data.roomId });
    });

    socket.on('call-answer', (data: { answer: any, roomId: string }) => {
      socket.to(data.roomId).emit('call-answer', { answer: data.answer, roomId: data.roomId });
    });

    socket.on('ice-candidate', (data: { candidate: any, roomId: string }) => {
      socket.to(data.roomId).emit('ice-candidate', { candidate: data.candidate });
    });

    // Chat — broadcast immediately AND persist to database
    socket.on('chat-message', async (data: { message: string, roomId: string }) => {
      const msgTimestamp = new Date();

      // Broadcast message immediately for real-time feel
      io.to(data.roomId).emit('chat-message', {
        message: data.message,
        senderId: userId,
        timestamp: msgTimestamp
      });

      // Persist chat message to CallSession record
      CallSession.findByIdAndUpdate(data.roomId, {
        $push: { chatMessages: { senderId: userId, message: data.message, timestamp: msgTimestamp } }
      }).catch(err => console.error('Failed to persist chat message:', err));

      // AI Text Moderation in background
      try {
        const moderationResult = await moderateText(data.message, userId, data.roomId);
        
        if (moderationResult) {
          if (moderationResult.riskLevel === 'CRITICAL' && moderationResult.recommendedAction === 'BLOCK_ACCOUNT') {
            io.to(data.roomId).emit('safety-warning', { message: 'This call has been terminated due to a severe safety policy violation.' });
            io.to(data.roomId).emit('call-ended');
            
            const room = io.sockets.adapter.rooms.get(data.roomId);
            if (room) {
              for (const sid of room) {
                const s = io.sockets.sockets.get(sid);
                if (s) {
                  if (s.id === socket.id) s.emit('account-restricted');
                  s.leave(data.roomId);
                }
              }
            }
          } else if (moderationResult.riskLevel === 'HIGH' || moderationResult.riskLevel === 'MEDIUM') {
             socket.emit('safety-warning', { message: 'Warning: Your recent message was flagged by our safety system.' });
          }
        }
      } catch (err) {
        console.error('Chat moderation failed', err);
      }
    });

    const endCallSession = async (roomId: string) => {
      try {
        const call = await CallSession.findById(roomId);
        if (call && call.status === 'ACTIVE') {
          const endedAt = new Date();
          const duration = Math.round((endedAt.getTime() - call.startedAt.getTime()) / 1000);
          await CallSession.findByIdAndUpdate(roomId, { 
            status: 'ENDED', 
            endedAt,
            duration
          });
        }
        io.to(roomId).emit('call-ended');
        
        // Make everyone leave the room
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
          for (const sid of [...room]) {
            const s = io.sockets.sockets.get(sid);
            if (s) s.leave(roomId);
          }
        }
      } catch (err) {
        console.error('End call error:', err);
      }
    };

    socket.on('end-call', async (data: { roomId: string }) => {
      await endCallSession(data.roomId);
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user?.username} (${socket.id})`);
      
      // Remove from online tracker and broadcast updated count
      removeOnlineUser(userId, socket.id);
      io.emit('online-count', getOnlineCount());

      // Clean up queue
      await MatchSession.findOneAndDelete({ socketId: socket.id });

      // End any active calls this user was in
      try {
        const activeCalls = await CallSession.find({
          status: 'ACTIVE',
          $or: [{ userA: userId }, { userB: userId }]
        });
        for (const call of activeCalls) {
          await endCallSession(call._id.toString());
        }
      } catch (err) {
        console.error('Disconnect cleanup error:', err);
      }
    });
  });
};
