import { OnModuleInit } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: ['http://localhost:3000'] },
})
export class Gateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('a user connected');
    });
  }

  @SubscribeMessage('newMessage')
  onNewMessage(@MessageBody() body: unknown) {
    this.server.emit('onMessage', {
      msg: 'New message',
      content: {},
    });
  }
}
