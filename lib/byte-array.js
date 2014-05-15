var constants = require('./constants')
  , ObjectEncoding = constants.ObjectEncoding
  , AMF0Types = constants.AMF0Types
  , AMF3Types = constants.AMF3Types


module.exports = ByteArray


function ByteArray(buffer) {
  this.objectEncoding = ObjectEncoding.AMF0

  this._buffer = buffer
  this._offset = 0
  this._read = 0
  this._objectTable = []
  this._stringTable = []
  this._traitTable = []
}

ByteArray.prototype = {
  move: function(bytes) {
    var prevOffset = this._offset
    this._read += bytes
    this._offset += bytes
    return prevOffset
  }

, position: function() {
    return this._offset
  }
, objectEncoding: function() {
    return this.objectEncoding
  }
, length: function() {
    return this._buffer.length
  }

  // readBoolean():Boolean
  // Reads a Boolean value from the byte stream.
, readBoolean: function() {
    return this._buffer.readUInt8(this.move(1))
  }

  // readByte():int
  // Reads a signed byte from the byte stream.
, readByte: function() {
    return this._buffer.readInt8(this.move(1))
  }

  // readBytes(bytes:ByteArray, offset:uint = 0, length:uint = 0):void
  // Reads the number of data bytes, specified by the length parameter, from the byte stream.
, readBytes: function(bytes, offset, length) {
    throw "NOT IMPLEMENTED"
  }

  // readDouble():Number
  // Reads an IEEE 754 double-precision (64-bit) floating-point number from the byte stream.
, readNumber: function() {
    return this._buffer.readDoubleBE(this.move(8))
  }

  // readFloat():Number
  // Reads an IEEE 754 single-precision (32-bit) floating-point number from the byte stream.
, readFloat: function() {
    return this._buffer.readFloatBE(this.move(4))
  }

  // readInt():int
  // Reads a signed 32-bit integer from the byte stream.
, readInt: function() {
    return this._buffer.readInt32BE(this.move(4))
  }

  // readMultiByte(length:uint, charSet:String):String
  // Reads a multibyte string of specified length from the byte stream using the specified character set.
, readMultiByte: function(length, charSet) {
    throw "NOT IMPLEMENTED"
  }

  // readObject():*
  // Reads an object from the byte array, encoded in AMF serialized format.
, readObject: function() {
    if (this.objectEncoding == ObjectEncoding.AMF0) {
      return this._readAMF0Object()
    } else if (this.objectEncoding == ObjectEncoding.AMF3) {
      return this._readAMF3Object();
    }
  }

  // readShort():int
  // Reads a signed 16-bit integer from the byte stream.
, readShort: function() {
    return this._buffer.readInt16BE(this.move(2))
  }

  // readUnsignedByte():uint
  // Reads an unsigned byte from the byte stream.
, readUnsignedByte: function() {
    return this._buffer.readUInt8(this.move(1))
  }

  // readUnsignedInt():uint
  // Reads an unsigned 32-bit integer from the byte stream.
, readUnsignedInt: function() {
    return this._buffer.readUInt32BE(this.move(4))
  }

  // readUnsignedShort():uint
  // Reads an unsigned 16-bit integer from the byte stream.
, readUnsignedShort: function() {
    return this._buffer.readUInt16BE(this.move(2))
  }

  // readUTF():String
  // Reads a UTF-8 string from the byte stream.
, readUTF: function() {
    var length = this._buffer.readUInt16BE(this.move(2))
    return this.readUTFBytes(length)
  }

, readLongUTF: function()
  {
    return this.readUTFBytes(this.readUInt30())
  }

  // readUTFBytes(length:uint):String
  // Reads a sequence of UTF-8 bytes specified by the length parameter from the byte stream and returns a string.
, readUTFBytes: function(length) {
    return this._buffer.toString('utf8', this._offset, this.move(length) + length)
  }

, readTraits: function(ref) {
    var traitInfo = {}
    traitInfo.properties = []

    if ((ref & 3) == 1) {
      return this.traitTable[(ref >> 2)]
    }

    traitInfo.externalizable = ((ref & 4) == 4)
    traitInfo.dynamic = ((ref & 8) == 8)
    traitInfo.count = (ref >> 4)
    traitInfo.className = this.readStringAMF3()

    this.traitTable.push(traitInfo)

    for (var i=0; i<traitInfo.count; ++i) {
      traitInfo.properties.push(this.readStringAMF3())
    }

    return traitInfo
  }

, writeByte: function(byte) {
    this._buffer.writeUInt8(this.move(1))
  }

  // helpers

, _readUInt29: function() {
    var value, b

    // each byte must be treated as unsigned
    b = this.readByte() & 0xFF;
    if (b < 128) {
      return b
    }

    value = (b & 0x7F) << 7
    b = this.readByte() & 0xFF
    if (b < 128) {
      return (value | b)
    }

    value = (value | (b & 0x7F)) << 7
    b = this.readByte() & 0xFF
    if (b < 128) {
      return (value | b)
    }

    value = (value | (b & 0x7F)) << 8
    b = this.readByte() & 0xFF
    return (value | b)
  }

, _readUInt30: function() {
    var ch1 = readByte()
      , ch2 = readByte()
      , ch3 = readByte()
      , ch4 = readByte()

    if (ch1 >= 64) {
      return undefined
    }

    return ch4 | (ch3 << 8) | (ch2 << 16) | (ch1 << 24)
  }

, _readStringAMF3: function() {
    var ref = this.readUInt29()

    if ((ref & 1) === 0) { // This is a reference
      return this.stringTable[(ref >> 1)]
    }

    var len = (ref >> 1)

    if (0 === len) {
      return ""
    }

    this._stringTable.push(this.readString(len))

    return str
  }

, _readExternalizable: function(className) {
    return this.readObject()
  }

, _readAMF0Object: function() {
    var marker = this.readByte();
    if (marker == AMF0Types.kNumberType) {
      return this.readDouble()
    } else if (marker === AMF0Types.kBooleanType) {
      return this.readBoolean()
    } else if (marker === AMF0Types.kStringType) {
      return this.readUTF()
    } else if ((marker === AMF0Types.kObjectType) || (marker === AMF0Types.kECMAArrayType)) {
      var o = {}
        , isMixed = (marker === AMF0Types.kECMAArrayType)
        , size = null

      if (isMixed) {
        this._readUInt30()
      }

      while (true) {
        var name = this.readUTF()

        if (this.readByte() === AMF0Types.kObjectEndType) { break }
        this.move(-1)

        o[name] = this.readObject()
      }

      return o
    } else if (marker === AMF0Types.kStrictArrayType) {
      var size = this.readInt()
        , a = []

      for (var i=0; i<size; ++i) {
        a.push(this.readObject())
      }

      return a
    } else if (marker === AMF0Types.kTypedObjectType) {
      var o = {}
        , typeName = this.readUTF()
        , propertyName = this.readUTF()
        , type = this.readByte()

      while (type !== kObjectEndType) {
        var value = this.readObject()
        o[propertyName] = value
        propertyName = this.readUTF()
        type = this.readByte()
      }

      return o
    } else if (marker === AMF0Types.kAvmPlusObjectType) {
      return this._readAMF3Object()
    } else if (marker === AMF0Types.kNullType) {
      return null
    } else if (marker === AMF0Types.kUndefinedType) {
      return undefined
    } else if (marker === AMF0Types.kReferenceType) {
      var refNum = this.readUnsignedShort()
        , value = this._objectTable[refNum]

      return value
    } else if (marker === AMF0Types.kDateType) {
      return this.readDate()
    } else if (marker === AMF0Types.kLongStringType) {
      return this.readLongUTF()
    } else if (marker == AMF0Types.kXMLObjectType) {
      return this.readXML()
    }
  }

, _readAMF3Object: function() {
    var marker = this.readByte()

    if (marker == AMF3Types.kUndefinedType) {
      return undefined
    } else if (marker === AMF3Types.kNullType) {
      return null
    } else if (marker === AMF3Types.kFalseType) {
      return false
    } else if (marker === AMF3Types.kTrueType) {
      return true
    } else if (marker === AMF3Types.kIntegerType) {
      var i = this._readUInt29()

      return i
    } else if (marker === AMF3Types.kDoubleType) {
      return this.readDouble()
    } else if (marker === AMF3Types.kStringType)  {
      return this.readStringAMF3()
    } else if (marker === AMF3Types.kXMLType) {
      return this.readXML()
    } else if (marker === AMF3Types.kDateType) {
      var ref = this._readUInt29()

      if ((ref & 1) === 0) {
        return this._objectTable[(ref >> 1)]
      }

      var d = this.readDouble()
        , value = new Date(d)
      this._objectTable.push(value)

      return value
    } else if (marker === AMF3Types.kArrayType) {
      var ref = this._readUInt29()

      if ((ref & 1) == 0) {
        return this._objectTable[(ref >> 1)]
      }

      var len = (ref >> 1)
        , key = readStringAMF3()

      if (key === "") {
        var a = []

        for (var i=0; i<len; ++i) {
          a.push(this.readObject());
        }

        return a
      }

      // mixed array
      var result = {}

      while (key !== "") {
        result[key] = this.readObject()
        key = this.readStringAMF3()
      }

      for (var i=0; i<len; ++i) {
        result[i] = this.readObject()
      }

      return result
    } else if (marker === AMF3Types.kObjectType) {
      var o = {}

      this._objectTable.push(o)

      var ref = this._readUInt29()

      if ((ref & 1) === 0) {
        return this._objectTable[(ref >> 1)]
      }

      var ti = this.readTraits(ref)
        , className = ti.className
        , externalizable = ti.externalizable

      if (externalizable) {
        o = this._readExternalizable(className)
      } else {
        var len = ti.properties.length

        for (var i=0; i<len; ++i) {
          var propName = ti.properties[i]
            , value = this.readObject()
          o[propName] = value
        }

        if (ti.dynamic) {
          for (;;) {
            var name = this.readStringAMF3()
            if (name === null || name.length === 0) {
              break
            }
            o[name] = this.readObject()
          }
        }
      }

      return o
    } else if (marker === AMF3Types.kAvmPlusXmlType) {
      var ref = this._readUInt29();

      if ((ref & 1) === 0) {
        return this._stringToXML(this._objectTable[(ref >> 1)])
      }

      var len = (ref >> 1)

      if (0 === len) {
        return null
      }

      var str = this.readUTFBytes(len)
        , xml = this._stringToXML(str)

      this._objectTable.push(xml)

      return xml
    } else if (marker === AMF3Types.kByteArrayType) {
      var ref = this._readUInt29();
      if ((ref & 1) === 0) {
        return this._objectTable[(ref >> 1)];
      }

      var len = (ref >> 1)
        , ba = new ByteArray(new Buffer(len))

      this._objectTable.push(ba)

      for (var i=0; i<len; ++i) {
        ba.writeByte(this.readByte())
      }

      return ba
    }
  }

, _stringToXML: function(str) {
    throw "NOT IMPLEMENTED _stringToXML"
    // var xmlDoc;

    // if (window.DOMParser)
    // {
    //   var parser = new DOMParser();
    //   xmlDoc = parser.parseFromString(str, "text/xml");
    // }
    // else // IE
    // {
    //   xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    //   xmlDoc.async = false;
    //   xmlDoc.loadXML(stc);
    // }

    // return xmlDoc;
  }
}

var runHarness = !module.parent
if (runHarness) {
   var data = new Buffer('03 00 03 66 6f 6f 02 00 03 62 61 72 00 00 09'.replace(/ /g, ''), 'hex')
     , ba = new ByteArray(data)

  console.log(ba.readObject())
}