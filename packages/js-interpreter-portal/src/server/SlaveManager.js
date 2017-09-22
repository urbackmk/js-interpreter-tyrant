import child_process from 'child_process';
import RPCInterface from './RPCInterface';
import {ClientEvents} from '../constants';

@RPCInterface
export default class SlaveManager {
  constructor(io) {
    this.io = io;
    this.backends = [];
  }

  provisionBackend(id) {
    const subprocess = child_process.spawn('yarn', ['run', 'startSlave'], {
      env: {
        ...process.env,
        SLAVE_ID: id,
      },
      stdio: 'inherit',
    });
    this.backends.push({id, subprocess});
  }

  getBackend(id) {
    return this.backends.find(b => b.id === id);
  }

  getBackends = async () =>
    this.backends.map(({id, socketId}) => ({id, socketId}));

  registerBackend = async ({id}, socketId) => {
    console.log('registering backend', id);
    const backend = this.getBackend(id);
    if (backend) {
      backend.socketId = socketId;
    } else {
      this.backends.push({id, socketId});
    }
    this.io
      .to('clients')
      .emit(ClientEvents.SLAVE_MANAGER_STATE_CHANGE, await this.getBackends());
  };

  setNumBackends = async ({numBackends}) => {
    for (let i = this.backends.length; i < numBackends; i++) {
      this.provisionBackend(`slave-${i}`);
    }
  };
}
