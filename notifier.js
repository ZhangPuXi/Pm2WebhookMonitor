const bent = require( 'bent' );
const os   = require( 'os'   );

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

function formUrlEncode( data ) {
  const result = [];

  Object.keys( data ).map( ( item ) => {
    result.push( `${ item }=${ data[ item ] }` );
  } );

  return result.join( '&' );
}

class Notifier {
  moduleConfig = null

  constructor ( moduleConfig ) {
    this.moduleConfig = moduleConfig;
  }

  notify( message ) {
    const requestJson = bent( 'json', {
      'Content-Type' : 'application/x-www-form-urlencoded'
    } );

    const moduleConfig = this.moduleConfig;
    const notifyUrl    = moduleConfig.webhookUrl;
    const phoneList    = [];

    if ( typeof moduleConfig.phone === 'string' ) {
      phoneList.push( ...moduleConfig.phone.split( ',' ) );
    } else if ( typeof moduleConfig.phone === 'number' ) {
      phoneList.push( moduleConfig.phone );
    }

    const keywordList = [
      `IP 地址：${ getLocalIpAddress() }`,
      `应用名称：${ message.name } ${ message.isRepeat ? 'and others' : '' }`,
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

  notifyAll( messageList ) {
    messageList.map( ( item ) => {
      this.notify( item );
    } );
  }
}

module.exports = Notifier;
