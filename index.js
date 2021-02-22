const pm2  = require( 'pm2'  );
const pmx  = require( 'pmx'  );
const bent = require( 'bent' );
const os   = require( 'os'   );

const moduleConfig = pmx.initModule();
const moduleName   = 'pm2-webhook-monitor';

function formUrlEncode( data ) {
  const result = [];

  Object.keys( data ).map( ( item ) => {
    result.push( `${ item }=${ data[ item ] }` );
  } );

  return result.join( '&' );
}

function getLocalIpAddress() {
  let result;

  const network = os.networkInterfaces();

  for ( let key in network ) {
    const networkUnit = network[ key ];

    networkUnit.map( ( item ) => {
      if ( item.family === 'IPv4' && !item.internal ) {
        result = item.address;
      }
    } );
  }

  if ( !result ) {
    result = 'Unknown IP Address';
  }

  return result;
}

function notify( message ) {
  const requestJson = bent( 'json', {
    'Content-Type' : 'application/x-www-form-urlencoded'
  } );

  const notifyUrl = moduleConfig.webhookUrl;
  const phoneList = [];

  if ( typeof moduleConfig.phone === 'string' ) {
    phoneList.push( ...moduleConfig.phone.split( ',' ) );
  } else if ( typeof moduleConfig.phone === 'number' ) {
    phoneList.push( moduleConfig.phone );
  }

  const keywordList = [
    `IP 地址：${ getLocalIpAddress() }`,
    `应用名称：${ message.name }`,
    `事件类型：${ message.event }`
  ];

  if ( message.timestamp ) {
    keywordList.push(
      `发生时间：${ new Date( message.timestamp ).toLocaleString() }`
    );
  }

  const requestOption = {
    templateid : 'NXGbDMj6FRpHw3hu3RlArM80B6pF_s7FVFalUxp7zXU',
    first      : encodeURIComponent( message.description ),
    keywordStr : encodeURIComponent( JSON.stringify( keywordList ) )
  };

  phoneList.map( ( item ) => {
    requestOption.phone = item;

    requestJson(
      notifyUrl + '?' + formUrlEncode( requestOption )
    );
  } );
}

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
    result = message;
  } else {
    result = '';
  }

  if ( result.length > 100 ) {
    result = result.slice( 0, 100 );
  }

  return result;
}

function listenLog( bus ) {
  bus.on( 'log:out', function ( data ) {
    if ( data.process.name !== moduleName ) {
      notify( {
        name        : parseProcessName( data.process ),
        event       : 'log',
        description : processLogMessage( data.data )
      } );
    }
  } );
}

function listenError( bus ) {
  bus.on( 'log:err', function ( data ) {
    if ( data.process.name !== moduleName ) {
      notify( {
        name        : parseProcessName( data.process ),
        event       : 'error',
        description : processLogMessage( data.data )
      } );
    }
  } );
}

function listenKill( bus ) {
  bus.on( 'pm2:kill', function ( data ) {
    notify( {
      name        : 'PM2',
      event       : 'kill',
      description : processLogMessage( data.msg ),
      timestamp   : ( new Date() ).getTime()
    } );
  } );
}

function listenException( bus ) {
  bus.on( 'process:exception', function ( data ) {
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

      notify( {
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

    if ( moduleConfig[ data.event ] && data.process.name !== moduleName ) {
      notify( {
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
