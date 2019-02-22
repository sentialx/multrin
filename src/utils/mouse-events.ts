import { EventEmitter } from 'events';
import { fork, ChildProcess } from 'child_process';

let registeredEvents: string[] = [];

let mouseProcess: ChildProcess;

class MouseEvents extends EventEmitter {
  constructor() {
    super();

    this.on('newListener', event => {
      if (registeredEvents.indexOf(event) !== -1) return;

      if (event === 'mouse-up') {
        mouseProcess = fork('./events/mouse.js');

        mouseProcess.on('message', msg => {
          if (msg === 'mouse-up') {
            this.emit('mouse-up');
          }
        });
      } else {
        return;
      }

      registeredEvents.push(event);
    });

    this.on('removeListener', event => {
      if (this.listenerCount(event) > 0) return;

      if (event === 'mouse-up') {
      }

      registeredEvents = registeredEvents.filter(x => x !== event);
    });
  }
}

const mouseEvents = new MouseEvents();

export { mouseEvents };
