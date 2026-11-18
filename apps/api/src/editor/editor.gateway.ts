import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SocketEvents, RenderProgressPayload, RenderCompletedPayload } from '@ai-video-studio/shared-types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EditorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EditorGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(SocketEvents.JOIN_PROJECT)
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string; user?: any }
  ) {
    const room = `project:${data.projectId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { status: 'joined', room };
  }

  @SubscribeMessage(SocketEvents.LEAVE_PROJECT)
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string }
  ) {
    const room = `project:${data.projectId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { status: 'left', room };
  }

  @SubscribeMessage(SocketEvents.PLAYHEAD_MOVE)
  handlePlayheadMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string; playhead: number; userId?: string }
  ) {
    const room = `project:${data.projectId}`;
    client.to(room).emit(SocketEvents.PLAYHEAD_MOVE, data);
  }

  /**
   * Broadcast render progress to all clients observing the project
   */
  broadcastRenderProgress(payload: RenderProgressPayload) {
    const room = `project:${payload.projectId}`;
    this.server.to(room).emit(SocketEvents.RENDER_PROGRESS, payload);
  }

  /**
   * Broadcast render completion to all clients observing the project
   */
  broadcastRenderCompleted(payload: RenderCompletedPayload) {
    const room = `project:${payload.projectId}`;
    this.server.to(room).emit(SocketEvents.RENDER_COMPLETED, payload);
  }
}

