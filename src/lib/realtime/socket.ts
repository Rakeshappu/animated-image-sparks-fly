import { Server } from 'socket.io';
import { verifyToken } from '../auth/jwt';
import mongoose from 'mongoose';
import { Resource } from '../db/models/Resource';
import { User } from '../db/models/User';
import { Notification } from '../db/models/Notification';

let io: Server;

export const initializeSocketIO = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:8080'],
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization']
    },
    path: '/socket.io'
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decodedToken = verifyToken(token);
      if (!decodedToken) {
        return next(new Error('Invalid token'));
      }
      
      // Attach user data to socket
      socket.data.user = decodedToken;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.user.id}`);
    
    // Join user-specific room
    socket.join(`user:${socket.data.user.id}`);
    
    // Join department room if applicable
    if (socket.data.user.department) {
      socket.join(`department:${socket.data.user.department}`);
    }
    
    // Join semester room for students
    if (socket.data.user.role === 'student' && socket.data.user.semester) {
      socket.join(`semester:${socket.data.user.semester}`);
      console.log(`Student ${socket.data.user.id} joined semester:${socket.data.user.semester} room`);
    }

    // Handle events
    socket.on('join-resource', (resourceId) => {
      socket.join(`resource:${resourceId}`);
    });

    socket.on('leave-resource', (resourceId) => {
      socket.leave(`resource:${resourceId}`);
    });

    socket.on('resource-update', (data) => {
      socket.to(`resource:${data.resourceId}`).emit('resource-updated', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user.id}`);
    });
  });

  return io;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit events to specific users, departments, or all users
export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) {
    console.error('Socket.io not initialized, cannot emit to user');
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
};

export const emitToDepartment = (department: string, event: string, data: any) => {
  if (!io) {
    console.error('Socket.io not initialized, cannot emit to department');
    return;
  }
  io.to(`department:${department}`).emit(event, data);
};

export const emitToAllUsers = (event: string, data: any) => {
  if (!io) {
    console.error('Socket.io not initialized, cannot emit to all users');
    return;
  }
  io.emit(event, data);
};

export const emitToSemester = (semester: number, event: string, data: any) => {
  if (!io) {
    console.error('Socket.io not initialized, cannot emit to semester');
    return;
  }
  console.log(`Emitting to semester:${semester} - Event: ${event}`);
  io.to(`semester:${semester}`).emit(event, data);
};

// Send resource upload notification to students in a specific semester
export const notifyResourceUpload = async (resourceId: string, facultyName: string, resourceTitle?: string, specificSemester?: string | number) => {
  try {
    console.log(`Starting notification process for resource ${resourceId} by ${facultyName}`);
    
    // Validate resourceId
    if (!mongoose.isValidObjectId(resourceId)) {
      console.error('Invalid resource ID:', resourceId);
      return;
    }
    
    // Get resource details
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      console.error('Resource not found:', resourceId);
      return;
    }
    
    // Determine target semester
    let targetSemester: number | null = null;
    
    // If specificSemester was provided (from API), use it
    if (specificSemester !== undefined && specificSemester !== null) {
      targetSemester = Number(specificSemester);
      console.log(`Using provided specific semester: ${targetSemester}`);
    } else if (resource.semester !== undefined) {
      // Otherwise use the semester from the resource
      targetSemester = resource.semester;
      console.log(`Using resource semester: ${targetSemester}`);
    }
    
    if (targetSemester === null) {
      console.error('No valid semester found for resource notification');
      return;
    }
    
    // For placement resources (semester 0), notify all students
    if (targetSemester === 0) {
      console.log('This is a placement resource (semester 0), notifying all students');
      
      // Create notification message
      const resourceTitleToUse = resourceTitle || resource.title;
      const notificationMessage = `New placement resource "${resourceTitleToUse}" uploaded by ${facultyName}`;
      
      // Find all students
      const students = await User.find({ role: 'student' });
      console.log(`Found ${students.length} students for placement notification`);
      
      // Create notifications in database for all students
      const notificationObjects = students.map(student => ({
        userId: student._id,
        message: notificationMessage,
        resourceId: new mongoose.Types.ObjectId(resourceId),
        read: false,
        createdAt: new Date()
      }));
      
      if (notificationObjects.length > 0) {
        await Notification.insertMany(notificationObjects);
        console.log(`Created ${notificationObjects.length} notifications for placement resource`);
      }
      
      // Send real-time notifications to each student individually
      for (const student of students) {
        emitToUser(student._id.toString(), 'new-resource', {
          message: notificationMessage,
          resource: {
            _id: resource._id,
            title: resourceTitleToUse,
            subject: resource.subject,
            semester: resource.semester,
            type: resource.type,
            uploadedBy: facultyName
          },
          timestamp: new Date()
        });
      }
      
      return;
    }
    
    // For regular resources, notify only students in that semester
    console.log(`This is a regular resource for semester ${targetSemester}`);
    
    // Get all students in this specific semester
    const students = await User.find({ 
      role: 'student', 
      semester: targetSemester 
    });
    
    console.log(`Found ${students.length} students in semester ${targetSemester}`);
    
    if (students.length === 0) {
      console.log(`No students found in semester ${targetSemester}`);
      return;
    }
    
    // Create notification message
    const resourceTitleToUse = resourceTitle || resource.title;
    const notificationMessage = `New resource "${resourceTitleToUse}" uploaded by ${facultyName} for semester ${targetSemester}`;
    
    // Create notifications in database for students in this semester
    const notificationObjects = students.map(student => ({
      userId: student._id,
      message: notificationMessage,
      resourceId: new mongoose.Types.ObjectId(resourceId),
      read: false,
      createdAt: new Date()
    }));
    
    if (notificationObjects.length > 0) {
      await Notification.insertMany(notificationObjects);
      console.log(`Created ${notificationObjects.length} notifications in database for semester ${targetSemester}`);
    }
    
    // Send real-time notifications to each student individually
    // This ensures delivery even if the semester room has issues
    for (const student of students) {
      console.log(`Sending notification to student ${student._id} in semester ${targetSemester}`);
      
      emitToUser(student._id.toString(), 'new-resource', {
        message: notificationMessage,
        resource: {
          _id: resource._id,
          title: resourceTitleToUse,
          subject: resource.subject,
          semester: resource.semester,
          type: resource.type,
          uploadedBy: facultyName
        },
        timestamp: new Date()
      });
    }
    
    // Also emit to the semester room as a backup
    emitToSemester(targetSemester, 'new-resource', {
      message: notificationMessage,
      resource: {
        _id: resource._id,
        title: resourceTitleToUse,
        subject: resource.subject,
        semester: resource.semester,
        type: resource.type,
        uploadedBy: facultyName
      },
      timestamp: new Date()
    });
    
    console.log(`Notification process completed for resource ${resourceId} to semester ${targetSemester}`);
  } catch (error) {
    console.error('Error sending resource notification:', error);
  }
};

// Notify faculty when a student interacts with their resource
export const notifyFacultyOfInteraction = async (
  resourceId: string, 
  studentId: string, 
  interactionType: 'like' | 'comment', 
  commentContent?: string
) => {
  try {
    if (!mongoose.isValidObjectId(resourceId) || !mongoose.isValidObjectId(studentId)) {
      console.error('Invalid resource or student ID');
      return;
    }
    
    // Get resource and student details
    let resource, student;
    
    try {
      resource = await Resource.findById(resourceId);
      student = await User.findById(studentId);
      
      if (!resource || !resource.uploadedBy || !student) {
        console.error('Resource, faculty, or student not found');
        return;
      }
    } catch (error) {
      console.error('Error finding resource or student:', error);
      return;
    }
    
    // Get faculty ID (the resource uploader)
    const facultyId = resource.uploadedBy.toString();
    
    // Prepare notification message
    let notificationMessage = '';
    if (interactionType === 'like') {
      notificationMessage = `${student.fullName} liked your resource "${resource.title}"`;
    } else if (interactionType === 'comment') {
      notificationMessage = `${student.fullName} commented on your resource "${resource.title}": ${commentContent?.substring(0, 50)}${commentContent && commentContent.length > 50 ? '...' : ''}`;
    }
    
    // Create notification in database
    try {
      await Notification.create({
        userId: facultyId,
        message: notificationMessage,
        resourceId: resource._id,
        read: false,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
    
    // Send real-time notification
    emitToUser(facultyId, 'resource-interaction', {
      message: notificationMessage,
      resourceId: resource._id,
      interactionType,
      student: {
        id: student._id,
        name: student.fullName
      },
      timestamp: new Date()
    });
    
    console.log(`Notification sent to faculty ${facultyId} for ${interactionType} by student ${student.fullName}`);
  } catch (error) {
    console.error(`Error notifying faculty of ${interactionType}:`, error);
  }
};
