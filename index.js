const pm2  = require( 'pm2'  );
const pmx  = require( 'pmx'  );
const bent = require( 'bent' );

const moduleConfig = pmx.initModule();
const moduleName   = 'pm2-webhook-monitor';

function formUrlEncode( data ) {
  const result = [];

  Object.keys( data ).map( ( item ) => {
    result.push( `${ item }=${ data[ item ] }` );
  } );

  return result.join( '&' );
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
    `应用名称：${ message.name }`, `事件类型：${ message.event }`
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

  if ( process.exec_mode === 'cluster_mode' && process.instances > 1 ) {
    result += `[${ process.pm_id }]`;
  }

  return result;
}

function listenLog( bus ) {
  bus.on( 'log:out', function ( data ) {
    if ( data.process.name !== moduleName ) {
      notify( {
        name        : parseProcessName( data.process ),
        event       : 'log',
        description : data.data
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
        description : data.data
      } );
    }
  } );
}

function listenKill( bus ) {
  bus.on( 'pm2:kill', function ( data ) {
    notify( {
      name        : 'PM2',
      event       : 'kill',
      description : data.msg,
      timestamp   : ( new Date() ).getTime()
    } );
  } );
}

function listenException( bus ) {
  bus.on( 'process:exception', function ( data ) {
    if ( data.process.name !== moduleName ) {
      notify( {
        name        : parseProcessName( data.process ),
        event       : 'exception',
        description : JSON.stringify( data.data ),
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
        description : '',
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
