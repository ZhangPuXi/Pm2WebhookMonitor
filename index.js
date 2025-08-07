const pm2          = require( 'pm2'                );
const pmx          = require( 'pmx'                );
const MessageQueue = require( './message-queue.js' );

const moduleConfig    = pmx.initModule();
const moduleName      = 'pm2-webhook-monitor';
const messageQueueMap = {};

function parseProcessName( process ) {
  let result;

  result = process.name;

  if ( process.exec_mode === 'cluster_mode' ) {
    result += `[${ process.pm_id }]`;
  }

  return result;
}

function processLogMessage( message ) {
  let result;

  if ( typeof message === 'string' ) {
    result = message.replace( /\[\d+(;\d+)*m/g, '' );
  } else {
    result = '';
  }

  if ( result.length > 500 ) {
    result = result.slice( 0, 500 );
  }

  return result;
}

function getMessageQueueSingleton( processName ) {
  if ( !messageQueueMap[ processName ] ) {
    messageQueueMap[ processName ] = new MessageQueue( moduleConfig );
  }

  return messageQueueMap[ processName ];
}

function listenLog( bus ) {
  bus.on( 'log:out', function ( data ) {
    const messageQueue = getMessageQueueSingleton( data.process.name );

    if ( data.process.name !== moduleName ) {
      messageQueue.addMessage( {
        name        : parseProcessName( data.process ),
        event       : 'log',
        description : processLogMessage( data.data )
      } );
    }
  } );
}

function listenError( bus ) {
  bus.on( 'log:err', function ( data ) {
    const messageQueue = getMessageQueueSingleton( data.process.name );

    if ( data.process.name !== moduleName ) {
      messageQueue.addMessage( {
        name        : parseProcessName( data.process ),
        event       : 'error',
        description : processLogMessage( data.data )
      } );
    }
  } );
}

function listenKill( bus ) {
  bus.on( 'pm2:kill', function ( data ) {
    const messageQueue = getMessageQueueSingleton( 'PM2' );

    messageQueue.addMessage( {
      name        : 'PM2',
      event       : 'kill',
      description : processLogMessage( data.msg ),
      timestamp   : ( new Date() ).getTime()
    } );
  } );
}

function listenException( bus ) {
  bus.on( 'process:exception', function ( data ) {
    const messageQueue = getMessageQueueSingleton( data.process.name );

    if ( data.process.name !== moduleName ) {
      let message;

      if ( data.data ) {
        if ( data.data.message ) {
          message = data.data.message;
        } else {
          try {
            message = JSON.stringify( data.data );
          } catch ( exception ) {
            message = Object.prototype.toString.call( data.data );
          }
        }
      }

      message = processLogMessage( message );

      messageQueue.addMessage( {
        name        : parseProcessName( data.process ),
        event       : 'exception',
        description : message,
        timestamp   : ( new Date() ).getTime()
      } );
    }
  } );
}

function listenProcessEvent( bus ) {
  bus.on( 'process:event', function ( data ) {
    // throw new Error( typeof moduleConfig.phone );

    const messageQueue = getMessageQueueSingleton( data.process.name );

    if ( moduleConfig[ data.event ] && data.process.name !== moduleName ) {
      messageQueue.addMessage( {
        name        : parseProcessName( data.process ),
        event       : data.event,
        description : `A ${ data.event } event is occurred.`,
        timestamp   : ( new Date() ).getTime()
      } );
    }
  } );
}

pm2.launchBus( function ( error, bus ) {
  if ( !error ) {
    if ( moduleConfig.log ) {
      listenLog( bus );
    }

    if ( moduleConfig.error ) {
      listenError( bus );
    }

    if ( moduleConfig.kill ) {
      listenKill( bus );
    }

    if ( moduleConfig.exception ) {
      listenException( bus );
    }

    listenProcessEvent( bus );
  }
} );
