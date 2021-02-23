const Notifier  = require( './notifier.js' );
const Scheduler = require( './scheduler.js' );

class MessageQueue {
  moduleConfig  = null
  queuedMessage = []
  notifier      = null
  scheduler     = null

  constructor ( moduleConfig ) {
    this.moduleConfig = moduleConfig;
    this.notifier     = new Notifier( moduleConfig );
    this.scheduler    = new Scheduler( moduleConfig );
  }

  addMessage( message ) {
    let index;

    index = -1;

    for ( let i = 0; i < this.queuedMessage.length; i++ ) {
      if ( this.queuedMessage[ i ].type === message.type ) {
        index = i;

        break;
      }
    }

    if ( index === -1 ) {
      this.queuedMessage.push( message );
    } else {
      this.queuedMessage[ index ].isRepeat = true;
    }

    this.scheduler.schedule( () => {
      this.notifier.notifyAll( [ ...this.queuedMessage ] );
      this.queuedMessage = [];
    } );
  }
}

module.exports = MessageQueue;
