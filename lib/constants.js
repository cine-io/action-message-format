var ns = module.exports = {}

ns.ObjectEncoding = {
  AMF0: 0
, AMF3: 3
}

ns.AMF0Types = {
  kNumberType:         0
, kBooleanType:        1
, kStringType:         2
, kObjectType:         3
, kMovieClipType:      4
, kNullType:           5
, kUndefinedType:      6
, kReferenceType:      7
, kECMAArrayType:      8
, kObjectEndType:      9
, kStrictArrayType:   10
, kDateType:          11
, kLongStringType:    12
, kUnsupportedType:   13
, kRecordsetType:     14
, kXMLObjectType:     15
, kTypedObjectType:   16
, kAvmPlusObjectType: 17
}

ns.AMF3Types = {
  kUndefinedType:   0
, kNullType:        1
, kFalseType:       2
, kTrueType:        3
, kIntegerType:     4
, kDoubleType:      5
, kStringType:      6
, kXMLType:         7
, kDateType:        8
, kArrayType:       9
, kObjectType:     10
, kAvmPlusXmlType: 11
, kByteArrayType:  12
}
