var constants = require('./constants')
  , AMF0Types = constants.AMF0Types
  , AMF3Types = constants.AMF3Types
  , ObjectEncoding = constants.ObjectEncoding
  , ByteArray = require('./byte-array')


function AMFPacket(version) {
  return {
    version: version || 0
  , headers: []
  , messages: []
  }
}

function AMFHeader(name, mustUnderstand, value) {
  return {
    name: name
  , mustUnderstand: mustUnderstand
  , value: value
  }
}

function AMFMessage(targetURI, responseURI, body) {
  return {
    targetURI: targetURI
  , responseURI: responseURI
  , body: body
  }
}


module.exports = decodeAMF

function decodeAMF(data) {
  var bytes = new ByteArray(data)
    , version = bytes.readUnsignedShort()
    , response = AMFPacket(0)

  console.log('version =', version)

  // read headers
  var headerCount = bytes.readUnsignedShort()
  for (var h=0; h<headerCount; ++h) {
    var headerName = bytes.readUTF()
      , mustUnderstand = bytes.readBoolean()
      , headerLength = bytes.readInt()

    console.log('headerName =', headerName)
    console.log('mustUnderstand =', mustUnderstand)
    console.log('headerLength =', headerLength)

    // handle AVM+ type marker
    if (version === ObjectEncoding.AMF3) {
      var typeMarker = bytes.readByte()
      if (typeMarker === AMF0Types.kAvmPlusObjectType) {
        bytes.objectEncoding = ObjectEncoding.AMF3
      } else {
        bytes.move(-1)
      }
    }

    var headerValue = bytes.readObject()

    console.log('headerValue =', headerValue)

   /*
     // Read off the remaining bytes to account for the reset of
     // the by-reference index on each header value
     remainingBytes = new a3d.ByteArray();
     remainingBytes.objectEncoding = bytes.objectEncoding;
     bytes.readBytes(remainingBytes, 0, bytes.length - bytes.pos);
     bytes = remainingBytes;
     remainingBytes = null;
     */

    response.headers.push(AMFHeader(headerName, mustUnderstand, headerValue))

    // Reset to AMF0 for next header
    bytes.objectEncoding = ObjectEncoding.AMF0;
  }

  // Message Bodies
  var messageCount = bytes.readUnsignedShort()
  for (var m=0; m<messageCount; ++m) {
    var targetURI = bytes.readUTF()
      , responseURI = bytes.readUTF()
      , messageLength = bytes.readInt()

    console.log('targetURI', targetURI)
    console.log('responseURI', responseURI)
    console.log('messageLength', messageLength)

    // Handle AVM+ type marker
    if (version === ObjectEncoding.AMF3) {
      var typeMarker = bytes.readByte()
      if (typeMarker == AMF0Types.kAvmPlusObjectType) {
        bytes.objectEncoding = a3d.ObjectEncoding.AMF3
      } else {
        bytes.move(-1)
      }
    }

    var messageBody = bytes.readObject()

    console.log('messageBody', messageBody)

    response.messages.push(AMFMessage(targetURI, responseURI, messageBody))

    // Reset to AMF0 for next message
    bytes.objectEncoding = ObjectEncoding.AMF0;
  }

  return response
}

var runHarness = !module.parent
if (runHarness) {
}
