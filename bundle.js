(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
(function (global){(function (){
"use strict";

var _todoistApiTypescript = require("@doist/todoist-api-typescript");
global.window.todo = _todoistApiTypescript.TodoistApi;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"@doist/todoist-api-typescript":17}],6:[function(require,module,exports){
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _asyncToGenerator(fn) {
  return function () {
    var self = this,
      args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(undefined);
    });
  };
}
module.exports = _asyncToGenerator, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],7:[function(require,module,exports){
var toPropertyKey = require("./toPropertyKey.js");
function _defineProperty(obj, key, value) {
  key = toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./toPropertyKey.js":11}],8:[function(require,module,exports){
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}
module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],9:[function(require,module,exports){
var _typeof = require("./typeof.js")["default"];
function _regeneratorRuntime() {
  "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */
  module.exports = _regeneratorRuntime = function _regeneratorRuntime() {
    return e;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
  var t,
    e = {},
    r = Object.prototype,
    n = r.hasOwnProperty,
    o = Object.defineProperty || function (t, e, r) {
      t[e] = r.value;
    },
    i = "function" == typeof Symbol ? Symbol : {},
    a = i.iterator || "@@iterator",
    c = i.asyncIterator || "@@asyncIterator",
    u = i.toStringTag || "@@toStringTag";
  function define(t, e, r) {
    return Object.defineProperty(t, e, {
      value: r,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }), t[e];
  }
  try {
    define({}, "");
  } catch (t) {
    define = function define(t, e, r) {
      return t[e] = r;
    };
  }
  function wrap(t, e, r, n) {
    var i = e && e.prototype instanceof Generator ? e : Generator,
      a = Object.create(i.prototype),
      c = new Context(n || []);
    return o(a, "_invoke", {
      value: makeInvokeMethod(t, r, c)
    }), a;
  }
  function tryCatch(t, e, r) {
    try {
      return {
        type: "normal",
        arg: t.call(e, r)
      };
    } catch (t) {
      return {
        type: "throw",
        arg: t
      };
    }
  }
  e.wrap = wrap;
  var h = "suspendedStart",
    l = "suspendedYield",
    f = "executing",
    s = "completed",
    y = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  var p = {};
  define(p, a, function () {
    return this;
  });
  var d = Object.getPrototypeOf,
    v = d && d(d(values([])));
  v && v !== r && n.call(v, a) && (p = v);
  var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
  function defineIteratorMethods(t) {
    ["next", "throw", "return"].forEach(function (e) {
      define(t, e, function (t) {
        return this._invoke(e, t);
      });
    });
  }
  function AsyncIterator(t, e) {
    function invoke(r, o, i, a) {
      var c = tryCatch(t[r], t, o);
      if ("throw" !== c.type) {
        var u = c.arg,
          h = u.value;
        return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
          invoke("next", t, i, a);
        }, function (t) {
          invoke("throw", t, i, a);
        }) : e.resolve(h).then(function (t) {
          u.value = t, i(u);
        }, function (t) {
          return invoke("throw", t, i, a);
        });
      }
      a(c.arg);
    }
    var r;
    o(this, "_invoke", {
      value: function value(t, n) {
        function callInvokeWithMethodAndArg() {
          return new e(function (e, r) {
            invoke(t, n, e, r);
          });
        }
        return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
      }
    });
  }
  function makeInvokeMethod(e, r, n) {
    var o = h;
    return function (i, a) {
      if (o === f) throw new Error("Generator is already running");
      if (o === s) {
        if ("throw" === i) throw a;
        return {
          value: t,
          done: !0
        };
      }
      for (n.method = i, n.arg = a;;) {
        var c = n.delegate;
        if (c) {
          var u = maybeInvokeDelegate(c, n);
          if (u) {
            if (u === y) continue;
            return u;
          }
        }
        if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
          if (o === h) throw o = s, n.arg;
          n.dispatchException(n.arg);
        } else "return" === n.method && n.abrupt("return", n.arg);
        o = f;
        var p = tryCatch(e, r, n);
        if ("normal" === p.type) {
          if (o = n.done ? s : l, p.arg === y) continue;
          return {
            value: p.arg,
            done: n.done
          };
        }
        "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
      }
    };
  }
  function maybeInvokeDelegate(e, r) {
    var n = r.method,
      o = e.iterator[n];
    if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
    var i = tryCatch(o, e.iterator, r.arg);
    if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
    var a = i.arg;
    return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
  }
  function pushTryEntry(t) {
    var e = {
      tryLoc: t[0]
    };
    1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
  }
  function resetTryEntry(t) {
    var e = t.completion || {};
    e.type = "normal", delete e.arg, t.completion = e;
  }
  function Context(t) {
    this.tryEntries = [{
      tryLoc: "root"
    }], t.forEach(pushTryEntry, this), this.reset(!0);
  }
  function values(e) {
    if (e || "" === e) {
      var r = e[a];
      if (r) return r.call(e);
      if ("function" == typeof e.next) return e;
      if (!isNaN(e.length)) {
        var o = -1,
          i = function next() {
            for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
            return next.value = t, next.done = !0, next;
          };
        return i.next = i;
      }
    }
    throw new TypeError(_typeof(e) + " is not iterable");
  }
  return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
    value: GeneratorFunctionPrototype,
    configurable: !0
  }), o(GeneratorFunctionPrototype, "constructor", {
    value: GeneratorFunction,
    configurable: !0
  }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
    var e = "function" == typeof t && t.constructor;
    return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
  }, e.mark = function (t) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
  }, e.awrap = function (t) {
    return {
      __await: t
    };
  }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
    return this;
  }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
    void 0 === i && (i = Promise);
    var a = new AsyncIterator(wrap(t, r, n, o), i);
    return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
      return t.done ? t.value : a.next();
    });
  }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
    return this;
  }), define(g, "toString", function () {
    return "[object Generator]";
  }), e.keys = function (t) {
    var e = Object(t),
      r = [];
    for (var n in e) r.push(n);
    return r.reverse(), function next() {
      for (; r.length;) {
        var t = r.pop();
        if (t in e) return next.value = t, next.done = !1, next;
      }
      return next.done = !0, next;
    };
  }, e.values = values, Context.prototype = {
    constructor: Context,
    reset: function reset(e) {
      if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
    },
    stop: function stop() {
      this.done = !0;
      var t = this.tryEntries[0].completion;
      if ("throw" === t.type) throw t.arg;
      return this.rval;
    },
    dispatchException: function dispatchException(e) {
      if (this.done) throw e;
      var r = this;
      function handle(n, o) {
        return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
      }
      for (var o = this.tryEntries.length - 1; o >= 0; --o) {
        var i = this.tryEntries[o],
          a = i.completion;
        if ("root" === i.tryLoc) return handle("end");
        if (i.tryLoc <= this.prev) {
          var c = n.call(i, "catchLoc"),
            u = n.call(i, "finallyLoc");
          if (c && u) {
            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
          } else if (c) {
            if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
          } else {
            if (!u) throw new Error("try statement without catch or finally");
            if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
          }
        }
      }
    },
    abrupt: function abrupt(t, e) {
      for (var r = this.tryEntries.length - 1; r >= 0; --r) {
        var o = this.tryEntries[r];
        if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
          var i = o;
          break;
        }
      }
      i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
      var a = i ? i.completion : {};
      return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
    },
    complete: function complete(t, e) {
      if ("throw" === t.type) throw t.arg;
      return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
    },
    finish: function finish(t) {
      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
        var r = this.tryEntries[e];
        if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
      }
    },
    "catch": function _catch(t) {
      for (var e = this.tryEntries.length - 1; e >= 0; --e) {
        var r = this.tryEntries[e];
        if (r.tryLoc === t) {
          var n = r.completion;
          if ("throw" === n.type) {
            var o = n.arg;
            resetTryEntry(r);
          }
          return o;
        }
      }
      throw new Error("illegal catch attempt");
    },
    delegateYield: function delegateYield(e, r, n) {
      return this.delegate = {
        iterator: values(e),
        resultName: r,
        nextLoc: n
      }, "next" === this.method && (this.arg = t), y;
    }
  }, e;
}
module.exports = _regeneratorRuntime, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./typeof.js":12}],10:[function(require,module,exports){
var _typeof = require("./typeof.js")["default"];
function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
module.exports = _toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./typeof.js":12}],11:[function(require,module,exports){
var _typeof = require("./typeof.js")["default"];
var toPrimitive = require("./toPrimitive.js");
function _toPropertyKey(arg) {
  var key = toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
}
module.exports = _toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{"./toPrimitive.js":10,"./typeof.js":12}],12:[function(require,module,exports){
function _typeof(o) {
  "@babel/helpers - typeof";

  return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(o);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;
},{}],13:[function(require,module,exports){
// TODO(Babel 8): Remove this file.

var runtime = require("../helpers/regeneratorRuntime")();
module.exports = runtime;

// Copied from https://github.com/facebook/regenerator/blob/main/packages/runtime/runtime.js#L736=
try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  if (typeof globalThis === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}

},{"../helpers/regeneratorRuntime":9}],14:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoistApi = void 0;
var runtypes_1 = require("runtypes");
var restClient_1 = require("./restClient");
var taskConverters_1 = require("./utils/taskConverters");
var endpoints_1 = require("./consts/endpoints");
var validators_1 = require("./utils/validators");
/**
 * Joins path segments using `/` separator.
 * @param segments A list of **valid** path segments.
 * @returns A joined path.
 */
function generatePath() {
    var segments = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        segments[_i] = arguments[_i];
    }
    return segments.join('/');
}
var TodoistApi = /** @class */ (function () {
    function TodoistApi(authToken, baseUrl) {
        this.authToken = authToken;
        this.restApiBase = (0, endpoints_1.getRestBaseUri)(baseUrl);
        this.syncApiBase = (0, endpoints_1.getSyncBaseUri)(baseUrl);
    }
    TodoistApi.prototype.getTask = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_TASKS, id), this.authToken)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateTask)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.getTasks = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, endpoints_1.ENDPOINT_REST_TASKS, this.authToken, args)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateTaskArray)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.addTask = function (args, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, endpoints_1.ENDPOINT_REST_TASKS, this.authToken, args, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateTask)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.quickAddTask = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var response, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('POST', this.syncApiBase, endpoints_1.ENDPOINT_SYNC_QUICK_ADD, this.authToken, args)];
                    case 1:
                        response = _a.sent();
                        task = (0, taskConverters_1.getTaskFromQuickAddResponse)(response.data);
                        return [2 /*return*/, (0, validators_1.validateTask)(task)];
                }
            });
        });
    };
    TodoistApi.prototype.updateTask = function (id, args, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_TASKS, id), this.authToken, args, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateTask)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.closeTask = function (id, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_TASKS, id, endpoints_1.ENDPOINT_REST_TASK_CLOSE), this.authToken, undefined, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, restClient_1.isSuccess)(response)];
                }
            });
        });
    };
    TodoistApi.prototype.reopenTask = function (id, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_TASKS, id, endpoints_1.ENDPOINT_REST_TASK_REOPEN), this.authToken, undefined, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, restClient_1.isSuccess)(response)];
                }
            });
        });
    };
    TodoistApi.prototype.deleteTask = function (id, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('DELETE', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_TASKS, id), this.authToken, undefined, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, restClient_1.isSuccess)(response)];
                }
            });
        });
    };
    TodoistApi.prototype.getProject = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_PROJECTS, id), this.authToken)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateProject)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.getProjects = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, endpoints_1.ENDPOINT_REST_PROJECTS, this.authToken)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateProjectArray)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.addProject = function (args, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, endpoints_1.ENDPOINT_REST_PROJECTS, this.authToken, args, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateProject)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.updateProject = function (id, args, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_PROJECTS, id), this.authToken, args, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateProject)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.deleteProject = function (id, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('DELETE', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_PROJECTS, id), this.authToken, undefined, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, restClient_1.isSuccess)(response)];
                }
            });
        });
    };
    TodoistApi.prototype.getProjectCollaborators = function (projectId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(projectId);
                        return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_PROJECTS, projectId, endpoints_1.ENDPOINT_REST_PROJECT_COLLABORATORS), this.authToken)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateUserArray)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.getSections = function (projectId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, endpoints_1.ENDPOINT_REST_SECTIONS, this.authToken, projectId ? { projectId: projectId } : undefined)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateSectionArray)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.getSection = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_SECTIONS, id), this.authToken)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateSection)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.addSection = function (args, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, endpoints_1.ENDPOINT_REST_SECTIONS, this.authToken, args, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateSection)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.updateSection = function (id, args, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_SECTIONS, id), this.authToken, args, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateSection)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.deleteSection = function (id, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('DELETE', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_SECTIONS, id), this.authToken, undefined, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, restClient_1.isSuccess)(response)];
                }
            });
        });
    };
    /**
     * Fetches a personal label
     */
    TodoistApi.prototype.getLabel = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_LABELS, id), this.authToken)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateLabel)(response.data)];
                }
            });
        });
    };
    /**
     * Fetches the personal labels
     */
    TodoistApi.prototype.getLabels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, endpoints_1.ENDPOINT_REST_LABELS, this.authToken)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateLabelArray)(response.data)];
                }
            });
        });
    };
    /**
     * Adds a personal label
     */
    TodoistApi.prototype.addLabel = function (args, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, endpoints_1.ENDPOINT_REST_LABELS, this.authToken, args, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateLabel)(response.data)];
                }
            });
        });
    };
    /**
     * Updates a personal label
     */
    TodoistApi.prototype.updateLabel = function (id, args, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_LABELS, id), this.authToken, args, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateLabel)(response.data)];
                }
            });
        });
    };
    /**
     * Deletes a personal label
     */
    TodoistApi.prototype.deleteLabel = function (id, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('DELETE', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_LABELS, id), this.authToken, undefined, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, restClient_1.isSuccess)(response)];
                }
            });
        });
    };
    TodoistApi.prototype.getSharedLabels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, endpoints_1.ENDPOINT_REST_LABELS_SHARED, this.authToken)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    TodoistApi.prototype.renameSharedLabel = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, endpoints_1.ENDPOINT_REST_LABELS_SHARED_RENAME, this.authToken, args)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TodoistApi.prototype.removeSharedLabel = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, endpoints_1.ENDPOINT_REST_LABELS_SHARED_REMOVE, this.authToken, args)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TodoistApi.prototype.getComments = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, endpoints_1.ENDPOINT_REST_COMMENTS, this.authToken, args)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateCommentArray)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.getComment = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('GET', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_COMMENTS, id), this.authToken)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateComment)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.addComment = function (args, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, endpoints_1.ENDPOINT_REST_COMMENTS, this.authToken, args, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateComment)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.updateComment = function (id, args, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('POST', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_COMMENTS, id), this.authToken, args, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, validators_1.validateComment)(response.data)];
                }
            });
        });
    };
    TodoistApi.prototype.deleteComment = function (id, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        runtypes_1.String.check(id);
                        return [4 /*yield*/, (0, restClient_1.request)('DELETE', this.restApiBase, generatePath(endpoints_1.ENDPOINT_REST_COMMENTS, id), this.authToken, undefined, requestId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, (0, restClient_1.isSuccess)(response)];
                }
            });
        });
    };
    return TodoistApi;
}());
exports.TodoistApi = TodoistApi;

},{"./consts/endpoints":16,"./restClient":18,"./utils/taskConverters":26,"./utils/validators":27,"runtypes":80}],15:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeAuthToken = exports.getAuthToken = exports.getAuthorizationUrl = exports.getAuthStateParameter = void 0;
var restClient_1 = require("./restClient");
var uuid_1 = require("uuid");
var types_1 = require("./types");
var endpoints_1 = require("./consts/endpoints");
function getAuthStateParameter() {
    return (0, uuid_1.v4)();
}
exports.getAuthStateParameter = getAuthStateParameter;
function getAuthorizationUrl(clientId, permissions, state, baseUrl) {
    if (!(permissions === null || permissions === void 0 ? void 0 : permissions.length)) {
        throw new Error('At least one scope value should be passed for permissions.');
    }
    var scope = permissions.join(',');
    return "".concat((0, endpoints_1.getAuthBaseUri)(baseUrl)).concat(endpoints_1.ENDPOINT_AUTHORIZATION, "?client_id=").concat(clientId, "&scope=").concat(scope, "&state=").concat(state);
}
exports.getAuthorizationUrl = getAuthorizationUrl;
function getAuthToken(args, baseUrl) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, restClient_1.request)('POST', (0, endpoints_1.getAuthBaseUri)(baseUrl), endpoints_1.ENDPOINT_GET_TOKEN, undefined, args)];
                case 1:
                    response = _b.sent();
                    if (response.status !== 200 || !((_a = response.data) === null || _a === void 0 ? void 0 : _a.accessToken)) {
                        throw new types_1.TodoistRequestError('Authentication token exchange failed.', response.status, response.data);
                    }
                    return [2 /*return*/, response.data];
            }
        });
    });
}
exports.getAuthToken = getAuthToken;
function revokeAuthToken(args, baseUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, restClient_1.request)('POST', (0, endpoints_1.getSyncBaseUri)(baseUrl), endpoints_1.ENDPOINT_REVOKE_TOKEN, undefined, args)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, (0, restClient_1.isSuccess)(response)];
            }
        });
    });
}
exports.revokeAuthToken = revokeAuthToken;

},{"./consts/endpoints":16,"./restClient":18,"./types":21,"uuid":113}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENDPOINT_REVOKE_TOKEN = exports.ENDPOINT_GET_TOKEN = exports.ENDPOINT_AUTHORIZATION = exports.ENDPOINT_SYNC_QUICK_ADD = exports.ENDPOINT_REST_PROJECT_COLLABORATORS = exports.ENDPOINT_REST_TASK_REOPEN = exports.ENDPOINT_REST_TASK_CLOSE = exports.ENDPOINT_REST_COMMENTS = exports.ENDPOINT_REST_LABELS_SHARED_REMOVE = exports.ENDPOINT_REST_LABELS_SHARED_RENAME = exports.ENDPOINT_REST_LABELS_SHARED = exports.ENDPOINT_REST_LABELS = exports.ENDPOINT_REST_SECTIONS = exports.ENDPOINT_REST_PROJECTS = exports.ENDPOINT_REST_TASKS = exports.getAuthBaseUri = exports.getSyncBaseUri = exports.getRestBaseUri = void 0;
var BASE_URI = 'https://api.todoist.com';
var API_REST_BASE_URI = '/rest/v2/';
var API_SYNC_BASE_URI = '/sync/v9/';
var TODOIST_URI = 'https://todoist.com';
var API_AUTHORIZATION_BASE_URI = '/oauth/';
function getRestBaseUri(domainBase) {
    if (domainBase === void 0) { domainBase = BASE_URI; }
    return new URL(API_REST_BASE_URI, domainBase).toString();
}
exports.getRestBaseUri = getRestBaseUri;
function getSyncBaseUri(domainBase) {
    if (domainBase === void 0) { domainBase = BASE_URI; }
    return new URL(API_SYNC_BASE_URI, domainBase).toString();
}
exports.getSyncBaseUri = getSyncBaseUri;
function getAuthBaseUri(domainBase) {
    if (domainBase === void 0) { domainBase = TODOIST_URI; }
    return new URL(API_AUTHORIZATION_BASE_URI, domainBase).toString();
}
exports.getAuthBaseUri = getAuthBaseUri;
exports.ENDPOINT_REST_TASKS = 'tasks';
exports.ENDPOINT_REST_PROJECTS = 'projects';
exports.ENDPOINT_REST_SECTIONS = 'sections';
exports.ENDPOINT_REST_LABELS = 'labels';
exports.ENDPOINT_REST_LABELS_SHARED = exports.ENDPOINT_REST_LABELS + '/shared';
exports.ENDPOINT_REST_LABELS_SHARED_RENAME = exports.ENDPOINT_REST_LABELS_SHARED + '/rename';
exports.ENDPOINT_REST_LABELS_SHARED_REMOVE = exports.ENDPOINT_REST_LABELS_SHARED + '/remove';
exports.ENDPOINT_REST_COMMENTS = 'comments';
exports.ENDPOINT_REST_TASK_CLOSE = 'close';
exports.ENDPOINT_REST_TASK_REOPEN = 'reopen';
exports.ENDPOINT_REST_PROJECT_COLLABORATORS = 'collaborators';
exports.ENDPOINT_SYNC_QUICK_ADD = 'quick/add';
exports.ENDPOINT_AUTHORIZATION = 'authorize';
exports.ENDPOINT_GET_TOKEN = 'access_token';
exports.ENDPOINT_REVOKE_TOKEN = 'access_tokens/revoke';

},{}],17:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./TodoistApi"), exports);
__exportStar(require("./restClient"), exports);
__exportStar(require("./authentication"), exports);
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);

},{"./TodoistApi":14,"./authentication":15,"./restClient":18,"./types":21,"./utils":24}],18:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.isSuccess = exports.paramsSerializer = void 0;
var axios_1 = __importDefault(require("axios"));
var axios_case_converter_1 = __importDefault(require("axios-case-converter"));
var errors_1 = require("./types/errors");
var uuid_1 = require("uuid");
var axios_retry_1 = __importDefault(require("axios-retry"));
function paramsSerializer(params) {
    var qs = new URLSearchParams();
    Object.keys(params).forEach(function (key) {
        var value = params[key];
        if (Array.isArray(value)) {
            qs.append(key, value.join(','));
        }
        else {
            qs.append(key, String(value));
        }
    });
    return qs.toString();
}
exports.paramsSerializer = paramsSerializer;
var defaultHeaders = {
    'Content-Type': 'application/json',
};
function getAuthHeader(apiKey) {
    return "Bearer ".concat(apiKey);
}
function isNetworkError(error) {
    return Boolean(!error.response && error.code !== 'ECONNABORTED');
}
function getRetryDelay(retryCount) {
    return retryCount === 1 ? 0 : 500;
}
function isAxiosError(error) {
    return Boolean(error === null || error === void 0 ? void 0 : error.isAxiosError);
}
function getTodoistRequestError(error, originalStack) {
    var requestError = new errors_1.TodoistRequestError(error.message);
    requestError.stack = isAxiosError(error) && originalStack ? originalStack.stack : error.stack;
    if (isAxiosError(error) && error.response) {
        requestError.httpStatusCode = error.response.status;
        requestError.responseData = error.response.data;
    }
    return requestError;
}
function getRequestConfiguration(baseURL, apiToken, requestId) {
    var authHeader = apiToken ? { Authorization: getAuthHeader(apiToken) } : undefined;
    var requestIdHeader = requestId ? { 'X-Request-Id': requestId } : undefined;
    var headers = __assign(__assign(__assign({}, defaultHeaders), authHeader), requestIdHeader);
    return { baseURL: baseURL, headers: headers };
}
function getAxiosClient(baseURL, apiToken, requestId) {
    var configuration = getRequestConfiguration(baseURL, apiToken, requestId);
    var client = (0, axios_case_converter_1.default)(axios_1.default.create(configuration));
    (0, axios_retry_1.default)(client, {
        retries: 3,
        retryCondition: isNetworkError,
        retryDelay: getRetryDelay,
    });
    return client;
}
function isSuccess(response) {
    return response.status >= 200 && response.status < 300;
}
exports.isSuccess = isSuccess;
function request(httpMethod, baseUri, relativePath, apiToken, payload, requestId) {
    return __awaiter(this, void 0, void 0, function () {
        var originalStack, axiosClient, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    originalStack = new Error();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 9, , 10]);
                    if (httpMethod === 'POST' && !requestId) {
                        requestId = (0, uuid_1.v4)();
                    }
                    axiosClient = getAxiosClient(baseUri, apiToken, requestId);
                    _a = httpMethod;
                    switch (_a) {
                        case 'GET': return [3 /*break*/, 2];
                        case 'POST': return [3 /*break*/, 4];
                        case 'DELETE': return [3 /*break*/, 6];
                    }
                    return [3 /*break*/, 8];
                case 2: return [4 /*yield*/, axiosClient.get(relativePath, {
                        params: payload,
                        paramsSerializer: paramsSerializer,
                    })];
                case 3: return [2 /*return*/, _b.sent()];
                case 4: return [4 /*yield*/, axiosClient.post(relativePath, payload)];
                case 5: return [2 /*return*/, _b.sent()];
                case 6: return [4 /*yield*/, axiosClient.delete(relativePath)];
                case 7: return [2 /*return*/, _b.sent()];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_1 = _b.sent();
                    if (!isAxiosError(error_1) && !(error_1 instanceof Error)) {
                        throw new Error('An unknown error occurred during the request');
                    }
                    throw getTodoistRequestError(error_1, originalStack);
                case 10: return [2 /*return*/];
            }
        });
    });
}
exports.request = request;

},{"./types/errors":20,"axios":36,"axios-case-converter":29,"axios-retry":34,"uuid":113}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Comment = exports.Attachment = exports.Label = exports.Section = exports.Project = exports.Task = exports.DueDate = exports.Int = void 0;
var runtypes_1 = require("runtypes");
exports.Int = runtypes_1.Number.withConstraint(function (n) { return Number.isInteger(n) || "".concat(n, " is not a valid entity id. Should be a string"); });
exports.DueDate = (0, runtypes_1.Record)({
    isRecurring: runtypes_1.Boolean,
    string: runtypes_1.String,
    date: runtypes_1.String,
}).And((0, runtypes_1.Partial)({
    datetime: runtypes_1.String.Or(runtypes_1.Null),
    timezone: runtypes_1.String.Or(runtypes_1.Null),
}));
exports.Task = (0, runtypes_1.Record)({
    id: runtypes_1.String,
    order: exports.Int,
    content: runtypes_1.String,
    description: runtypes_1.String,
    projectId: runtypes_1.String,
    isCompleted: runtypes_1.Boolean,
    labels: (0, runtypes_1.Array)(runtypes_1.String),
    priority: exports.Int,
    commentCount: exports.Int,
    createdAt: runtypes_1.String,
    url: runtypes_1.String,
    creatorId: runtypes_1.String,
}).And((0, runtypes_1.Partial)({
    due: exports.DueDate.Or(runtypes_1.Null),
    assigneeId: runtypes_1.String.Or(runtypes_1.Null),
    assignerId: runtypes_1.String.Or(runtypes_1.Null),
    parentId: runtypes_1.String.Or(runtypes_1.Null),
    sectionId: runtypes_1.String.Or(runtypes_1.Null),
}));
exports.Project = (0, runtypes_1.Record)({
    id: runtypes_1.String,
    name: runtypes_1.String,
    color: runtypes_1.String,
    commentCount: exports.Int,
    isShared: runtypes_1.Boolean,
    isFavorite: runtypes_1.Boolean,
    url: runtypes_1.String,
    isInboxProject: runtypes_1.Boolean,
    isTeamInbox: runtypes_1.Boolean,
    order: exports.Int,
    viewStyle: runtypes_1.String,
}).And((0, runtypes_1.Partial)({
    parentId: runtypes_1.String.Or(runtypes_1.Null),
}));
exports.Section = (0, runtypes_1.Record)({
    id: runtypes_1.String,
    order: exports.Int,
    name: runtypes_1.String,
    projectId: runtypes_1.String,
});
exports.Label = (0, runtypes_1.Record)({
    id: runtypes_1.String,
    order: exports.Int,
    name: runtypes_1.String,
    color: runtypes_1.String,
    isFavorite: runtypes_1.Boolean,
});
exports.Attachment = (0, runtypes_1.Record)({
    resourceType: runtypes_1.String,
}).And((0, runtypes_1.Partial)({
    fileName: runtypes_1.String.Or(runtypes_1.Null),
    fileSize: exports.Int.Or(runtypes_1.Null),
    fileType: runtypes_1.String.Or(runtypes_1.Null),
    fileUrl: runtypes_1.String.Or(runtypes_1.Null),
    fileDuration: exports.Int.Or(runtypes_1.Null),
    uploadState: (0, runtypes_1.Union)((0, runtypes_1.Literal)('pending'), (0, runtypes_1.Literal)('completed')).Or(runtypes_1.Null),
    image: runtypes_1.String.Or(runtypes_1.Null),
    imageWidth: exports.Int.Or(runtypes_1.Null),
    imageHeight: exports.Int.Or(runtypes_1.Null),
    url: runtypes_1.String.Or(runtypes_1.Null),
    title: runtypes_1.String.Or(runtypes_1.Null),
}));
exports.Comment = (0, runtypes_1.Record)({
    id: runtypes_1.String,
    content: runtypes_1.String,
    postedAt: runtypes_1.String,
}).And((0, runtypes_1.Partial)({
    taskId: runtypes_1.String.Or(runtypes_1.Null),
    projectId: runtypes_1.String.Or(runtypes_1.Null),
    attachment: exports.Attachment.Or(runtypes_1.Null),
}));
exports.User = (0, runtypes_1.Record)({
    id: runtypes_1.String,
    name: runtypes_1.String,
    email: runtypes_1.String,
});

},{"runtypes":80}],20:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoistRequestError = void 0;
var ts_custom_error_1 = require("ts-custom-error");
var authenticationErrorCodes = [401, 403];
var TodoistRequestError = /** @class */ (function (_super) {
    __extends(TodoistRequestError, _super);
    function TodoistRequestError(message, httpStatusCode, responseData) {
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.httpStatusCode = httpStatusCode;
        _this.responseData = responseData;
        _this.isAuthenticationError = function () {
            if (!_this.httpStatusCode) {
                return false;
            }
            return authenticationErrorCodes.includes(_this.httpStatusCode);
        };
        Object.defineProperty(_this, 'name', { value: 'TodoistRequestError' });
        return _this;
    }
    return TodoistRequestError;
}(ts_custom_error_1.CustomError));
exports.TodoistRequestError = TodoistRequestError;

},{"ts-custom-error":110}],21:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./entities"), exports);
__exportStar(require("./errors"), exports);
__exportStar(require("./requests"), exports);

},{"./entities":19,"./errors":20,"./requests":22}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColorByKey = exports.getColorByName = exports.getColorById = exports.defaultColor = exports.colors = exports.taupe = exports.gray = exports.charcoal = exports.salmon = exports.magenta = exports.lavender = exports.violet = exports.grape = exports.blue = exports.lightBlue = exports.skyBlue = exports.turquoise = exports.mintGreen = exports.green = exports.limeGreen = exports.oliveGreen = exports.yellow = exports.orange = exports.red = exports.berryRed = void 0;
exports.berryRed = {
    id: 30,
    key: 'berry_red',
    displayName: 'Berry Red',
    name: 'Berry Red',
    hexValue: '#b8255f',
    value: '#b8255f',
};
exports.red = {
    id: 31,
    key: 'red',
    displayName: 'Red',
    name: 'Red',
    hexValue: '#db4035',
    value: '#db4035',
};
exports.orange = {
    id: 32,
    key: 'orange',
    displayName: 'Orange',
    name: 'Orange',
    hexValue: '#ff9933',
    value: '#ff9933',
};
exports.yellow = {
    id: 33,
    key: 'yellow',
    displayName: 'Yellow',
    name: 'Yellow',
    hexValue: '#fad000',
    value: '#fad000',
};
exports.oliveGreen = {
    id: 34,
    key: 'olive_green',
    displayName: 'Olive Green',
    name: 'Olive Green',
    hexValue: '#afb83b',
    value: '#afb83b',
};
exports.limeGreen = {
    id: 35,
    key: 'lime_green',
    displayName: 'Lime Green',
    name: 'Lime Green',
    hexValue: '#7ecc49',
    value: '#7ecc49',
};
exports.green = {
    id: 36,
    key: 'green',
    displayName: 'Green',
    name: 'Green',
    hexValue: '#299438',
    value: '#299438',
};
exports.mintGreen = {
    id: 37,
    key: 'mint_green',
    displayName: 'Mint Green',
    name: 'Mint Green',
    hexValue: '#6accbc',
    value: '#6accbc',
};
exports.turquoise = {
    id: 38,
    key: 'turquoise',
    displayName: 'Turquoise',
    name: 'Turquoise',
    hexValue: '#158fad',
    value: '#158fad',
};
exports.skyBlue = {
    id: 39,
    key: 'sky_blue',
    displayName: 'Sky Blue',
    name: 'Sky Blue',
    hexValue: '#14aaf5',
    value: '#14aaf5',
};
exports.lightBlue = {
    id: 40,
    key: 'light_blue',
    displayName: 'Light Blue',
    name: 'Light Blue',
    hexValue: '#96c3eb',
    value: '#96c3eb',
};
exports.blue = {
    id: 41,
    key: 'blue',
    displayName: 'Blue',
    name: 'Blue',
    hexValue: '#4073ff',
    value: '#4073ff',
};
exports.grape = {
    id: 42,
    key: 'grape',
    displayName: 'Grape',
    name: 'Grape',
    hexValue: '#884dff',
    value: '#884dff',
};
exports.violet = {
    id: 43,
    key: 'violet',
    displayName: 'Violet',
    name: 'Violet',
    hexValue: '#af38eb',
    value: '#af38eb',
};
exports.lavender = {
    id: 44,
    key: 'lavender',
    displayName: 'Lavender',
    name: 'Lavender',
    hexValue: '#eb96eb',
    value: '#eb96eb',
};
exports.magenta = {
    id: 45,
    key: 'magenta',
    displayName: 'Magenta',
    name: 'Magenta',
    hexValue: '#e05194',
    value: '#e05194',
};
exports.salmon = {
    id: 46,
    key: 'salmon',
    displayName: 'Salmon',
    name: 'Salmon',
    hexValue: '#ff8d85',
    value: '#ff8d85',
};
exports.charcoal = {
    id: 47,
    key: 'charcoal',
    displayName: 'Charcoal',
    name: 'Charcoal',
    hexValue: '#808080',
    value: '#808080',
};
exports.gray = {
    id: 48,
    key: 'gray',
    displayName: 'Gray',
    name: 'Gray',
    hexValue: '#b8b8b8',
    value: '#b8b8b8',
};
exports.taupe = {
    id: 49,
    key: 'taupe',
    displayName: 'Taupe',
    name: 'Taupe',
    hexValue: '#ccac93',
    value: '#ccac93',
};
exports.colors = [
    exports.berryRed,
    exports.red,
    exports.orange,
    exports.yellow,
    exports.oliveGreen,
    exports.limeGreen,
    exports.green,
    exports.mintGreen,
    exports.turquoise,
    exports.skyBlue,
    exports.lightBlue,
    exports.blue,
    exports.grape,
    exports.violet,
    exports.lavender,
    exports.magenta,
    exports.salmon,
    exports.charcoal,
    exports.gray,
    exports.taupe,
];
exports.defaultColor = exports.charcoal;
/**
 * @deprecated Use {@link getColorByKey} instead
 */
function getColorById(colorId) {
    var color = exports.colors.find(function (color) { return color.id === colorId; });
    return color !== null && color !== void 0 ? color : exports.defaultColor;
}
exports.getColorById = getColorById;
/**
 * @deprecated Use {@link getColorByKey} instead
 */
function getColorByName(colorName) {
    var color = exports.colors.find(function (color) { return color.name === colorName; });
    return color !== null && color !== void 0 ? color : exports.defaultColor;
}
exports.getColorByName = getColorByName;
function getColorByKey(colorKey) {
    var color = exports.colors.find(function (color) { return color.key === colorKey; });
    return color !== null && color !== void 0 ? color : exports.defaultColor;
}
exports.getColorByKey = getColorByKey;

},{}],24:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./colors"), exports);
__exportStar(require("./sanitization"), exports);

},{"./colors":23,"./sanitization":25}],25:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSanitizedTasks = exports.getSanitizedContent = void 0;
var BOLD_FORMAT = /(^|[\s!?,;>:]+)(?:\*\*|__|!!)(.+?)(\*\*|__|!!)(?=$|[\s!?,;><:]+)/gi;
var ITALIC_FORMAT = /(^|[\s!?,;>:]+)(?:\*|_|!)(.+?)(\*|_|!)(?=$|[\s!?,;><:]+)/gi;
var BOLD_ITALIC_FORMAT = /(^|[\s!?,;>:]+)(?:\*\*\*|___|!!!)(.+?)(\*\*\*|___|!!!)(?=$|[\s!?,;><:]+)/gi;
var CODE_BLOCK_FORMAT = /```([\s\S]*?)```/gi;
var CODE_INLINE_FORMAT = /`([^`]+)`/gi;
var TODOIST_LINK = /((?:(?:onenote:)?[\w-]+):\/\/[^\s]+)\s+[[(]([^)]+)[\])]/gi;
var MARKDOWN_LINK = /\[(.+?)\]\((.+?)\)/gi;
var GMAIL_LINK = /\[\[gmail=(.+?),\s*(.+?)\]\]/gi;
var OUTLOOK_LINK = /\[\[outlook=(.+?),\s*(.+?)\]\]/gi;
var THUNDERBIRD_LINK = /\[\[thunderbird\n(.+)\n(.+)\n\s*\]\]/gi;
var FAKE_SECTION_PREFIX = '* ';
var FAKE_SECTION_SUFFIX = ':';
function removeStyleFormatting(input) {
    if (!input.includes('!') && !input.includes('*') && !input.includes('_')) {
        return input;
    }
    function removeMarkdown(match, prefix, text) {
        return "".concat(prefix).concat(text);
    }
    input = input.replace(BOLD_ITALIC_FORMAT, removeMarkdown);
    input = input.replace(BOLD_FORMAT, removeMarkdown);
    input = input.replace(ITALIC_FORMAT, removeMarkdown);
    return input;
}
function removeCodeFormatting(input) {
    function removeMarkdown(match, text) {
        return text;
    }
    input = input.replace(CODE_BLOCK_FORMAT, removeMarkdown);
    input = input.replace(CODE_INLINE_FORMAT, removeMarkdown);
    return input;
}
function removeFakeSectionFormatting(input) {
    if (input.startsWith(FAKE_SECTION_PREFIX)) {
        input = input.slice(FAKE_SECTION_PREFIX.length);
    }
    if (input.endsWith(FAKE_SECTION_SUFFIX)) {
        input = input.slice(0, input.length - FAKE_SECTION_SUFFIX.length);
    }
    return input;
}
function removeMarkdownLinks(input) {
    if (!input.includes('[') || !input.includes(']')) {
        return input;
    }
    function removeMarkdown(match, text) {
        return text;
    }
    return input.replace(MARKDOWN_LINK, removeMarkdown);
}
function removeTodoistLinks(input) {
    if (!input.includes('(') || !input.includes(')')) {
        return input;
    }
    function removeMarkdown(match, url, text) {
        return text;
    }
    return input.replace(TODOIST_LINK, removeMarkdown);
}
function removeAppLinks(input) {
    if (input.includes('gmail')) {
        input = input.replace(GMAIL_LINK, function (match, id, text) { return text; });
    }
    if (input.includes('outlook')) {
        input = input.replace(OUTLOOK_LINK, function (match, id, text) { return text; });
    }
    if (input.includes('thunderbird')) {
        input = input.replace(THUNDERBIRD_LINK, function (match, text) { return text; });
    }
    return input;
}
function getSanitizedContent(input) {
    input = removeStyleFormatting(input);
    input = removeCodeFormatting(input);
    input = removeFakeSectionFormatting(input);
    input = removeMarkdownLinks(input);
    input = removeTodoistLinks(input);
    input = removeAppLinks(input);
    return input;
}
exports.getSanitizedContent = getSanitizedContent;
function getSanitizedTasks(tasks) {
    return tasks.map(function (task) { return (__assign(__assign({}, task), { sanitizedContent: getSanitizedContent(task.content) })); });
}
exports.getSanitizedTasks = getSanitizedTasks;

},{}],26:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskFromQuickAddResponse = void 0;
var showTaskEndpoint = 'https://todoist.com/showTask';
function getTaskUrlFromQuickAddResponse(responseData) {
    return "".concat(showTaskEndpoint, "?id=").concat(responseData.id);
}
function getTaskFromQuickAddResponse(responseData) {
    var _a;
    var due = responseData.due
        ? __assign(__assign({ isRecurring: responseData.due.isRecurring, string: responseData.due.string, date: responseData.due.date }, (responseData.due.timezone !== null && { datetime: responseData.due.date })), (responseData.due.timezone !== null && { timezone: responseData.due.timezone })) : undefined;
    var task = __assign(__assign(__assign({ id: responseData.id, order: responseData.childOrder, content: responseData.content, description: responseData.description, projectId: responseData.projectId, sectionId: responseData.sectionId ? responseData.sectionId : undefined, isCompleted: responseData.checked, labels: responseData.labels, priority: responseData.priority, commentCount: 0, createdAt: responseData.addedAt, url: getTaskUrlFromQuickAddResponse(responseData), creatorId: (_a = responseData.addedByUid) !== null && _a !== void 0 ? _a : '' }, (due !== undefined && { due: due })), (responseData.parentId !== null && { parentId: responseData.parentId })), (responseData.responsibleUid !== null && {
        assigneeId: responseData.responsibleUid,
    }));
    return task;
}
exports.getTaskFromQuickAddResponse = getTaskFromQuickAddResponse;

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserArray = exports.validateUser = exports.validateCommentArray = exports.validateComment = exports.validateLabelArray = exports.validateLabel = exports.validateSectionArray = exports.validateSection = exports.validateProjectArray = exports.validateProject = exports.validateTaskArray = exports.validateTask = void 0;
var types_1 = require("../types");
function validateTask(input) {
    return types_1.Task.check(input);
}
exports.validateTask = validateTask;
function validateTaskArray(input) {
    return input.map(validateTask);
}
exports.validateTaskArray = validateTaskArray;
function validateProject(input) {
    return types_1.Project.check(input);
}
exports.validateProject = validateProject;
function validateProjectArray(input) {
    return input.map(validateProject);
}
exports.validateProjectArray = validateProjectArray;
function validateSection(input) {
    return types_1.Section.check(input);
}
exports.validateSection = validateSection;
function validateSectionArray(input) {
    return input.map(validateSection);
}
exports.validateSectionArray = validateSectionArray;
function validateLabel(input) {
    return types_1.Label.check(input);
}
exports.validateLabel = validateLabel;
function validateLabelArray(input) {
    return input.map(validateLabel);
}
exports.validateLabelArray = validateLabelArray;
function validateComment(input) {
    return types_1.Comment.check(input);
}
exports.validateComment = validateComment;
function validateCommentArray(input) {
    return input.map(validateComment);
}
exports.validateCommentArray = validateCommentArray;
function validateUser(input) {
    return types_1.User.check(input);
}
exports.validateUser = validateUser;
function validateUserArray(input) {
    return input.map(validateUser);
}
exports.validateUserArray = validateUserArray;

},{"../types":21}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preserveSpecificKeys = exports.applyCaseOptions = void 0;
var tslib_1 = require("tslib");
var applyCaseOptions = function (fn, defaultOptions) {
    return function (input, options) {
        return fn(input, tslib_1.__assign(tslib_1.__assign({}, defaultOptions), options));
    };
};
exports.applyCaseOptions = applyCaseOptions;
var preserveSpecificKeys = function (fn, keys) {
    var condition = typeof keys === 'function'
        ? keys
        : function (input) { return keys.includes(input); };
    return function (input, options) {
        return condition(input, options) ? input : fn(input, options);
    };
};
exports.preserveSpecificKeys = preserveSpecificKeys;

},{"tslib":111}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var middleware_1 = require("./middleware");
exports.default = middleware_1.applyCaseMiddleware;
tslib_1.__exportStar(require("./types"), exports);

},{"./middleware":30,"./types":32,"tslib":111}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCaseMiddleware = exports.createCamelResponseTransformer = exports.createSnakeRequestTransformer = exports.createSnakeParamsInterceptor = void 0;
var tslib_1 = require("tslib");
var transformers_1 = require("./transformers");
var util_1 = require("./util");
var createSnakeParamsInterceptor = function (options) {
    var snake = (0, transformers_1.createObjectTransformers)(options === null || options === void 0 ? void 0 : options.caseFunctions).snake;
    return function (config) {
        if (config.params) {
            config.params = snake(config.params, options);
        }
        return config;
    };
};
exports.createSnakeParamsInterceptor = createSnakeParamsInterceptor;
var createSnakeRequestTransformer = function (options) {
    var _a = (0, transformers_1.createObjectTransformers)(options === null || options === void 0 ? void 0 : options.caseFunctions), snake = _a.snake, header = _a.header;
    return function (data, headers) {
        overwriteHeadersOrNoop(headers, header, options, [
            'common',
            'delete',
            'get',
            'head',
            'post',
            'put',
            'patch',
        ]);
        return snake(data, options);
    };
};
exports.createSnakeRequestTransformer = createSnakeRequestTransformer;
var createCamelResponseTransformer = function (options) {
    var camel = (0, transformers_1.createObjectTransformers)(options === null || options === void 0 ? void 0 : options.caseFunctions).camel;
    return function (data, headers) {
        overwriteHeadersOrNoop(headers, camel, options);
        return camel(data, options);
    };
};
exports.createCamelResponseTransformer = createCamelResponseTransformer;
var overwriteHeadersOrNoop = function (headers, fn, options, excludedKeys) {
    var e_1, _a, _b, _c;
    if ((options === null || options === void 0 ? void 0 : options.ignoreHeaders) ||
        (!(0, util_1.isPlainObject)(headers) && !(0, util_1.isAxiosHeaders)(headers))) {
        return;
    }
    try {
        for (var _d = tslib_1.__values(Object.entries(headers)), _e = _d.next(); !_e.done; _e = _d.next()) {
            var _f = tslib_1.__read(_e.value, 2), key = _f[0], value = _f[1];
            fn(value, tslib_1.__assign({ overwrite: true }, options));
            if ((excludedKeys || []).includes(key)) {
                continue;
            }
            if ((0, util_1.isAxiosHeaders)(headers)) {
                headers.delete(key);
                headers.set(Object.keys(fn((_b = {}, _b[key] = null, _b), options))[0], value, true);
            }
            else {
                delete headers[key];
                headers[Object.keys(fn((_c = {}, _c[key] = null, _c), options))[0]] = value;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
        }
        finally { if (e_1) throw e_1.error; }
    }
};
var applyCaseMiddleware = function (axios, options) {
    var _a, _b, _c;
    axios.defaults.transformRequest = tslib_1.__spreadArray([
        ((_a = options === null || options === void 0 ? void 0 : options.caseMiddleware) === null || _a === void 0 ? void 0 : _a.requestTransformer) ||
            (0, exports.createSnakeRequestTransformer)(options)
    ], tslib_1.__read((Array.isArray(axios.defaults.transformRequest)
        ? axios.defaults.transformRequest
        : axios.defaults.transformRequest !== undefined
            ? [axios.defaults.transformRequest]
            : [])), false);
    axios.defaults.transformResponse = tslib_1.__spreadArray(tslib_1.__spreadArray([], tslib_1.__read((Array.isArray(axios.defaults.transformResponse)
        ? axios.defaults.transformResponse
        : axios.defaults.transformResponse !== undefined
            ? [axios.defaults.transformResponse]
            : [])), false), [
        ((_b = options === null || options === void 0 ? void 0 : options.caseMiddleware) === null || _b === void 0 ? void 0 : _b.responseTransformer) ||
            (0, exports.createCamelResponseTransformer)(options),
    ], false);
    axios.interceptors.request.use(((_c = options === null || options === void 0 ? void 0 : options.caseMiddleware) === null || _c === void 0 ? void 0 : _c.requestInterceptor) ||
        (0, exports.createSnakeParamsInterceptor)(options));
    return axios;
};
exports.applyCaseMiddleware = applyCaseMiddleware;

},{"./transformers":31,"./util":33,"tslib":111}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createObjectTransformers = exports.createObjectTransformerOf = exports.createObjectTransformer = void 0;
var tslib_1 = require("tslib");
var camel_case_1 = require("camel-case");
var snake_case_1 = require("snake-case");
var header_case_1 = require("header-case");
var decorators_1 = require("./decorators");
var util_1 = require("./util");
var caseFunctions = {
    snake: snake_case_1.snakeCase,
    camel: camel_case_1.camelCase,
    header: header_case_1.headerCase,
};
var transformObjectUsingCallbackRecursive = function (data, fn, overwrite) {
    var e_1, _a, e_2, _b, e_3, _c;
    if (!(0, util_1.isTransformable)(data)) {
        return data;
    }
    /* eslint-disable no-console */
    // Check FormData/URLSearchParams compatibility
    if (((0, util_1.isFormData)(data) || (0, util_1.isURLSearchParams)(data)) &&
        (!data.entries || (overwrite && !data.delete))) {
        var type = (0, util_1.isFormData)(data) ? 'FormData' : 'URLSearchParams';
        var polyfill = (0, util_1.isFormData)(data)
            ? 'https://github.com/jimmywarting/FormData'
            : 'https://github.com/jerrybendy/url-search-params-polyfill';
        if (typeof navigator !== 'undefined' &&
            navigator.product === 'ReactNative') {
            // You cannot transform FormData/URLSearchParams on React Native
            console.warn("Be careful that ".concat(type, " cannot be transformed on React Native. If you intentionally implemented, ignore this kind of warning: https://facebook.github.io/react-native/docs/debugging.html"));
        }
        else {
            if (!data.entries) {
                // You need to polyfill `entries` method
                console.warn("You must use polyfill of ".concat(type, ".prototype.entries() on Internet Explorer or Safari: ").concat(polyfill));
            }
            if (overwrite && !data.delete) {
                // You need to polyfill `delete` method for overwriting
                console.warn("You must use polyfill of ".concat(type, ".prototype.delete() on Internet Explorer or Safari: ").concat(polyfill));
            }
        }
        return data;
    }
    /* eslint-enable no-console */
    var prototype = Object.getPrototypeOf(data);
    // Storage of new values.
    // New instances are created when overwriting is disabled.
    var store = overwrite
        ? data
        : !prototype
            ? Object.create(null)
            : new prototype.constructor();
    // We need to clean up all entries before overwriting.
    var series;
    if ((0, util_1.isFormData)(data) || (0, util_1.isURLSearchParams)(data)) {
        // Create native iterator from FormData/URLSearchParams
        series = data.entries();
        if (overwrite) {
            // When overwriting, native iterator needs to be copied as array.
            series = tslib_1.__spreadArray([], tslib_1.__read(series), false);
            try {
                for (var series_1 = tslib_1.__values(series), series_1_1 = series_1.next(); !series_1_1.done; series_1_1 = series_1.next()) {
                    var _d = tslib_1.__read(series_1_1.value, 1), key = _d[0];
                    data.delete(key);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (series_1_1 && !series_1_1.done && (_a = series_1.return)) _a.call(series_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    }
    else {
        // Create array from objects
        series = Object.entries(data);
        // Array keys never change, so we don't need to clean up
        if (overwrite && !Array.isArray(data)) {
            try {
                for (var series_2 = tslib_1.__values(series), series_2_1 = series_2.next(); !series_2_1.done; series_2_1 = series_2.next()) {
                    var _e = tslib_1.__read(series_2_1.value, 1), key = _e[0];
                    delete data[key];
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (series_2_1 && !series_2_1.done && (_b = series_2.return)) _b.call(series_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    }
    try {
        for (var series_3 = tslib_1.__values(series), series_3_1 = series_3.next(); !series_3_1.done; series_3_1 = series_3.next()) {
            var _f = tslib_1.__read(series_3_1.value, 2), key = _f[0], value = _f[1];
            if ((0, util_1.isFormData)(store) || (0, util_1.isURLSearchParams)(store)) {
                store.append(fn(key), value);
            }
            else if (key !== '__proto__') {
                store[fn(typeof key === 'string' ? key : "".concat(key))] =
                    transformObjectUsingCallbackRecursive(value, fn, overwrite);
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (series_3_1 && !series_3_1.done && (_c = series_3.return)) _c.call(series_3);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return store;
};
var transformObjectUsingCallback = function (data, fn, options) {
    fn = (0, decorators_1.applyCaseOptions)(fn, tslib_1.__assign({ stripRegexp: /[^A-Z0-9[\]]+/gi }, options === null || options === void 0 ? void 0 : options.caseOptions));
    if (options === null || options === void 0 ? void 0 : options.preservedKeys) {
        fn = (0, decorators_1.preserveSpecificKeys)(fn, options.preservedKeys);
    }
    return transformObjectUsingCallbackRecursive(data, fn, (options === null || options === void 0 ? void 0 : options.overwrite) || false);
};
var createObjectTransformer = function (fn) {
    return function (data, options) {
        return transformObjectUsingCallback(data, fn, options);
    };
};
exports.createObjectTransformer = createObjectTransformer;
var createObjectTransformerOf = function (functionName, options) {
    return (0, exports.createObjectTransformer)((options === null || options === void 0 ? void 0 : options[functionName]) || caseFunctions[functionName]);
};
exports.createObjectTransformerOf = createObjectTransformerOf;
var createObjectTransformers = function (options) {
    var e_4, _a;
    var functionNames = Object.keys(caseFunctions);
    var objectTransformers = {};
    try {
        for (var functionNames_1 = tslib_1.__values(functionNames), functionNames_1_1 = functionNames_1.next(); !functionNames_1_1.done; functionNames_1_1 = functionNames_1.next()) {
            var functionName = functionNames_1_1.value;
            objectTransformers[functionName] = (0, exports.createObjectTransformerOf)(functionName, options);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (functionNames_1_1 && !functionNames_1_1.done && (_a = functionNames_1.return)) _a.call(functionNames_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return objectTransformers;
};
exports.createObjectTransformers = createObjectTransformers;

},{"./decorators":28,"./util":33,"camel-case":68,"header-case":71,"snake-case":109,"tslib":111}],32:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAxiosHeaders = exports.isTransformable = exports.isPlainObject = exports.isFormData = exports.isURLSearchParams = void 0;
var isURLSearchParams = function (value) {
    return (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams);
};
exports.isURLSearchParams = isURLSearchParams;
var isFormData = function (value) {
    return typeof FormData !== 'undefined' && value instanceof FormData;
};
exports.isFormData = isFormData;
var isPlainObject = function (value) {
    if (value == null) {
        return false;
    }
    var proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
};
exports.isPlainObject = isPlainObject;
var isTransformable = function (value) {
    return (Array.isArray(value) ||
        (0, exports.isPlainObject)(value) ||
        (0, exports.isFormData)(value) ||
        (0, exports.isURLSearchParams)(value));
};
exports.isTransformable = isTransformable;
// Dirty hack for unexported AxiosHeaders.
// Don't handle it as Transformable to reduce the scope of the impact.
var isAxiosHeaders = function (value) {
    var _a, _b;
    if (value == null) {
        return false;
    }
    return ((_b = (_a = Object.getPrototypeOf(value)) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name) === 'AxiosHeaders';
};
exports.isAxiosHeaders = isAxiosHeaders;

},{}],34:[function(require,module,exports){
const axiosRetry = require('./lib/cjs/index').default;

module.exports = axiosRetry;
module.exports.default = axiosRetry;

},{"./lib/cjs/index":35}],35:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isNetworkError = isNetworkError;
exports.isRetryableError = isRetryableError;
exports.isSafeRequestError = isSafeRequestError;
exports.isIdempotentRequestError = isIdempotentRequestError;
exports.isNetworkOrIdempotentRequestError = isNetworkOrIdempotentRequestError;
exports.exponentialDelay = exponentialDelay;
exports.default = axiosRetry;
exports.namespace = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _isRetryAllowed = _interopRequireDefault(require("is-retry-allowed"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var namespace = 'axios-retry';
/**
 * @param  {Error}  error
 * @return {boolean}
 */

exports.namespace = namespace;

function isNetworkError(error) {
  return !error.response && Boolean(error.code) && // Prevents retrying cancelled requests
  error.code !== 'ECONNABORTED' && // Prevents retrying timed out requests
  (0, _isRetryAllowed.default)(error); // Prevents retrying unsafe errors
}

var SAFE_HTTP_METHODS = ['get', 'head', 'options'];
var IDEMPOTENT_HTTP_METHODS = SAFE_HTTP_METHODS.concat(['put', 'delete']);
/**
 * @param  {Error}  error
 * @return {boolean}
 */

function isRetryableError(error) {
  return error.code !== 'ECONNABORTED' && (!error.response || error.response.status >= 500 && error.response.status <= 599);
}
/**
 * @param  {Error}  error
 * @return {boolean}
 */


function isSafeRequestError(error) {
  if (!error.config) {
    // Cannot determine if the request can be retried
    return false;
  }

  return isRetryableError(error) && SAFE_HTTP_METHODS.indexOf(error.config.method) !== -1;
}
/**
 * @param  {Error}  error
 * @return {boolean}
 */


function isIdempotentRequestError(error) {
  if (!error.config) {
    // Cannot determine if the request can be retried
    return false;
  }

  return isRetryableError(error) && IDEMPOTENT_HTTP_METHODS.indexOf(error.config.method) !== -1;
}
/**
 * @param  {Error}  error
 * @return {boolean}
 */


function isNetworkOrIdempotentRequestError(error) {
  return isNetworkError(error) || isIdempotentRequestError(error);
}
/**
 * @return {number} - delay in milliseconds, always 0
 */


function noDelay() {
  return 0;
}
/**
 * Set delayFactor 1000 for an exponential delay to occur on the order
 * of seconds
 * @param  {number} [retryNumber=0]
 * @param  {Error}  error - unused; for existing API of retryDelay callback
 * @param  {number} [delayFactor=100] milliseconds
 * @return {number} - delay in milliseconds
 */


function exponentialDelay() {
  var retryNumber = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var error = arguments.length > 1 ? arguments[1] : undefined;
  var delayFactor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 100;
  var delay = Math.pow(2, retryNumber) * delayFactor;
  var randomSum = delay * 0.2 * Math.random(); // 0-20% of the delay

  return delay + randomSum;
}
/**
 * Initializes and returns the retry state for the given request/config
 * @param  {AxiosRequestConfig} config
 * @return {Object}
 */


function getCurrentState(config) {
  var currentState = config[namespace] || {};
  currentState.retryCount = currentState.retryCount || 0;
  config[namespace] = currentState;
  return currentState;
}
/**
 * Returns the axios-retry options for the current request
 * @param  {AxiosRequestConfig} config
 * @param  {AxiosRetryConfig} defaultOptions
 * @return {AxiosRetryConfig}
 */


function getRequestOptions(config, defaultOptions) {
  return _objectSpread(_objectSpread({}, defaultOptions), config[namespace]);
}
/**
 * @param  {Axios} axios
 * @param  {AxiosRequestConfig} config
 */


function fixConfig(axios, config) {
  if (axios.defaults.agent === config.agent) {
    delete config.agent;
  }

  if (axios.defaults.httpAgent === config.httpAgent) {
    delete config.httpAgent;
  }

  if (axios.defaults.httpsAgent === config.httpsAgent) {
    delete config.httpsAgent;
  }
}
/**
 * Checks retryCondition if request can be retried. Handles it's retruning value or Promise.
 * @param  {number} retries
 * @param  {Function} retryCondition
 * @param  {Object} currentState
 * @param  {Error} error
 * @return {boolean}
 */


function shouldRetry(_x, _x2, _x3, _x4) {
  return _shouldRetry.apply(this, arguments);
}
/**
 * Adds response interceptors to an axios instance to retry requests failed due to network issues
 *
 * @example
 *
 * import axios from 'axios';
 *
 * axiosRetry(axios, { retries: 3 });
 *
 * axios.get('http://example.com/test') // The first request fails and the second returns 'ok'
 *   .then(result => {
 *     result.data; // 'ok'
 *   });
 *
 * // Exponential back-off retry delay between requests
 * axiosRetry(axios, { retryDelay : axiosRetry.exponentialDelay});
 *
 * // Custom retry delay
 * axiosRetry(axios, { retryDelay : (retryCount) => {
 *   return retryCount * 1000;
 * }});
 *
 * // Also works with custom axios instances
 * const client = axios.create({ baseURL: 'http://example.com' });
 * axiosRetry(client, { retries: 3 });
 *
 * client.get('/test') // The first request fails and the second returns 'ok'
 *   .then(result => {
 *     result.data; // 'ok'
 *   });
 *
 * // Allows request-specific configuration
 * client
 *   .get('/test', {
 *     'axios-retry': {
 *       retries: 0
 *     }
 *   })
 *   .catch(error => { // The first request fails
 *     error !== undefined
 *   });
 *
 * @param {Axios} axios An axios instance (the axios object or one created from axios.create)
 * @param {Object} [defaultOptions]
 * @param {number} [defaultOptions.retries=3] Number of retries
 * @param {boolean} [defaultOptions.shouldResetTimeout=false]
 *        Defines if the timeout should be reset between retries
 * @param {Function} [defaultOptions.retryCondition=isNetworkOrIdempotentRequestError]
 *        A function to determine if the error can be retried
 * @param {Function} [defaultOptions.retryDelay=noDelay]
 *        A function to determine the delay between retry requests
 * @param {Function} [defaultOptions.onRetry=()=>{}]
 *        A function to get notified when a retry occurs
 * @return {{ requestInterceptorId: number, responseInterceptorId: number }}
 *        The ids of the interceptors added to the request and to the response (so they can be ejected at a later time)
 */


function _shouldRetry() {
  _shouldRetry = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee2(retries, retryCondition, currentState, error) {
    var shouldRetryOrPromise, shouldRetryPromiseResult;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            shouldRetryOrPromise = currentState.retryCount < retries && retryCondition(error); // This could be a promise

            if (!((0, _typeof2.default)(shouldRetryOrPromise) === 'object')) {
              _context2.next = 12;
              break;
            }

            _context2.prev = 2;
            _context2.next = 5;
            return shouldRetryOrPromise;

          case 5:
            shouldRetryPromiseResult = _context2.sent;
            return _context2.abrupt("return", shouldRetryPromiseResult !== false);

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2["catch"](2);
            return _context2.abrupt("return", false);

          case 12:
            return _context2.abrupt("return", shouldRetryOrPromise);

          case 13:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[2, 9]]);
  }));
  return _shouldRetry.apply(this, arguments);
}

function axiosRetry(axios, defaultOptions) {
  var requestInterceptorId = axios.interceptors.request.use(function (config) {
    var currentState = getCurrentState(config);
    currentState.lastRequestTime = Date.now();
    return config;
  });
  var responseInterceptorId = axios.interceptors.response.use(null, /*#__PURE__*/function () {
    var _ref = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee(error) {
      var config, _getRequestOptions, _getRequestOptions$re, retries, _getRequestOptions$re2, retryCondition, _getRequestOptions$re3, retryDelay, _getRequestOptions$sh, shouldResetTimeout, _getRequestOptions$on, onRetry, currentState, delay, lastRequestDuration, timeout;

      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              config = error.config; // If we have no information to retry the request

              if (config) {
                _context.next = 3;
                break;
              }

              return _context.abrupt("return", Promise.reject(error));

            case 3:
              _getRequestOptions = getRequestOptions(config, defaultOptions), _getRequestOptions$re = _getRequestOptions.retries, retries = _getRequestOptions$re === void 0 ? 3 : _getRequestOptions$re, _getRequestOptions$re2 = _getRequestOptions.retryCondition, retryCondition = _getRequestOptions$re2 === void 0 ? isNetworkOrIdempotentRequestError : _getRequestOptions$re2, _getRequestOptions$re3 = _getRequestOptions.retryDelay, retryDelay = _getRequestOptions$re3 === void 0 ? noDelay : _getRequestOptions$re3, _getRequestOptions$sh = _getRequestOptions.shouldResetTimeout, shouldResetTimeout = _getRequestOptions$sh === void 0 ? false : _getRequestOptions$sh, _getRequestOptions$on = _getRequestOptions.onRetry, onRetry = _getRequestOptions$on === void 0 ? function () {} : _getRequestOptions$on;
              currentState = getCurrentState(config);
              _context.next = 7;
              return shouldRetry(retries, retryCondition, currentState, error);

            case 7:
              if (!_context.sent) {
                _context.next = 20;
                break;
              }

              currentState.retryCount += 1;
              delay = retryDelay(currentState.retryCount, error); // Axios fails merging this configuration to the default configuration because it has an issue
              // with circular structures: https://github.com/mzabriskie/axios/issues/370

              fixConfig(axios, config);

              if (!(!shouldResetTimeout && config.timeout && currentState.lastRequestTime)) {
                _context.next = 17;
                break;
              }

              lastRequestDuration = Date.now() - currentState.lastRequestTime;
              timeout = config.timeout - lastRequestDuration - delay;

              if (!(timeout <= 0)) {
                _context.next = 16;
                break;
              }

              return _context.abrupt("return", Promise.reject(error));

            case 16:
              config.timeout = timeout;

            case 17:
              config.transformRequest = [function (data) {
                return data;
              }];
              onRetry(currentState.retryCount, error, config);
              return _context.abrupt("return", new Promise(function (resolve) {
                return setTimeout(function () {
                  return resolve(axios(config));
                }, delay);
              }));

            case 20:
              return _context.abrupt("return", Promise.reject(error));

            case 21:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x5) {
      return _ref.apply(this, arguments);
    };
  }());
  return {
    requestInterceptorId: requestInterceptorId,
    responseInterceptorId: responseInterceptorId
  };
} // Compatibility with CommonJS


axiosRetry.isNetworkError = isNetworkError;
axiosRetry.isSafeRequestError = isSafeRequestError;
axiosRetry.isIdempotentRequestError = isIdempotentRequestError;
axiosRetry.isNetworkOrIdempotentRequestError = isNetworkOrIdempotentRequestError;
axiosRetry.exponentialDelay = exponentialDelay;
axiosRetry.isRetryableError = isRetryableError;

},{"@babel/runtime/helpers/asyncToGenerator":6,"@babel/runtime/helpers/defineProperty":7,"@babel/runtime/helpers/interopRequireDefault":8,"@babel/runtime/helpers/typeof":12,"@babel/runtime/regenerator":13,"is-retry-allowed":72}],36:[function(require,module,exports){
module.exports = require('./lib/axios');
},{"./lib/axios":38}],37:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var cookies = require('./../helpers/cookies');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var transitionalDefaults = require('../defaults/transitional');
var AxiosError = require('../core/AxiosError');
var CanceledError = require('../cancel/CanceledError');
var parseProtocol = require('../helpers/parseProtocol');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;
    var responseType = config.responseType;
    var onCanceled;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    }

    if (utils.isFormData(requestData) && utils.isStandardBrowserEnv()) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);

    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
        request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
      var transitional = config.transitional || transitionalDefaults;
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(new AxiosError(
        timeoutErrorMessage,
        transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
        config,
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = function(cancel) {
        if (!request) {
          return;
        }
        reject(!cancel || (cancel && cancel.type) ? new CanceledError() : cancel);
        request.abort();
        request = null;
      };

      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }

    if (!requestData) {
      requestData = null;
    }

    var protocol = parseProtocol(fullPath);

    if (protocol && [ 'http', 'https', 'file' ].indexOf(protocol) === -1) {
      reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
      return;
    }


    // Send the request
    request.send(requestData);
  });
};

},{"../cancel/CanceledError":40,"../core/AxiosError":43,"../core/buildFullPath":45,"../defaults/transitional":51,"../helpers/parseProtocol":63,"./../core/settle":48,"./../helpers/buildURL":54,"./../helpers/cookies":56,"./../helpers/isURLSameOrigin":59,"./../helpers/parseHeaders":62,"./../utils":67}],38:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Expose Cancel & CancelToken
axios.CanceledError = require('./cancel/CanceledError');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');
axios.VERSION = require('./env/data').version;
axios.toFormData = require('./helpers/toFormData');

// Expose AxiosError class
axios.AxiosError = require('../lib/core/AxiosError');

// alias for CanceledError for backward compatibility
axios.Cancel = axios.CanceledError;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// Expose isAxiosError
axios.isAxiosError = require('./helpers/isAxiosError');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

},{"../lib/core/AxiosError":43,"./cancel/CancelToken":39,"./cancel/CanceledError":40,"./cancel/isCancel":41,"./core/Axios":42,"./core/mergeConfig":47,"./defaults":50,"./env/data":52,"./helpers/bind":53,"./helpers/isAxiosError":58,"./helpers/spread":64,"./helpers/toFormData":65,"./utils":67}],39:[function(require,module,exports){
'use strict';

var CanceledError = require('./CanceledError');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;

  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;

  // eslint-disable-next-line func-names
  this.promise.then(function(cancel) {
    if (!token._listeners) return;

    var i;
    var l = token._listeners.length;

    for (i = 0; i < l; i++) {
      token._listeners[i](cancel);
    }
    token._listeners = null;
  });

  // eslint-disable-next-line func-names
  this.promise.then = function(onfulfilled) {
    var _resolve;
    // eslint-disable-next-line func-names
    var promise = new Promise(function(resolve) {
      token.subscribe(resolve);
      _resolve = resolve;
    }).then(onfulfilled);

    promise.cancel = function reject() {
      token.unsubscribe(_resolve);
    };

    return promise;
  };

  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new CanceledError(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `CanceledError` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Subscribe to the cancel signal
 */

CancelToken.prototype.subscribe = function subscribe(listener) {
  if (this.reason) {
    listener(this.reason);
    return;
  }

  if (this._listeners) {
    this._listeners.push(listener);
  } else {
    this._listeners = [listener];
  }
};

/**
 * Unsubscribe from the cancel signal
 */

CancelToken.prototype.unsubscribe = function unsubscribe(listener) {
  if (!this._listeners) {
    return;
  }
  var index = this._listeners.indexOf(listener);
  if (index !== -1) {
    this._listeners.splice(index, 1);
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

},{"./CanceledError":40}],40:[function(require,module,exports){
'use strict';

var AxiosError = require('../core/AxiosError');
var utils = require('../utils');

/**
 * A `CanceledError` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function CanceledError(message) {
  // eslint-disable-next-line no-eq-null,eqeqeq
  AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED);
  this.name = 'CanceledError';
}

utils.inherits(CanceledError, AxiosError, {
  __CANCEL__: true
});

module.exports = CanceledError;

},{"../core/AxiosError":43,"../utils":67}],41:[function(require,module,exports){
'use strict';

module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

},{}],42:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');
var buildFullPath = require('./buildFullPath');
var validator = require('../helpers/validator');

var validators = validator.validators;
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(configOrUrl, config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof configOrUrl === 'string') {
    config = config || {};
    config.url = configOrUrl;
  } else {
    config = configOrUrl || {};
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  var transitional = config.transitional;

  if (transitional !== undefined) {
    validator.assertOptions(transitional, {
      silentJSONParsing: validators.transitional(validators.boolean),
      forcedJSONParsing: validators.transitional(validators.boolean),
      clarifyTimeoutError: validators.transitional(validators.boolean)
    }, false);
  }

  // filter out skipped interceptors
  var requestInterceptorChain = [];
  var synchronousRequestInterceptors = true;
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
      return;
    }

    synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });

  var promise;

  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest, undefined];

    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    chain = chain.concat(responseInterceptorChain);

    promise = Promise.resolve(config);
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  }


  var newConfig = config;
  while (requestInterceptorChain.length) {
    var onFulfilled = requestInterceptorChain.shift();
    var onRejected = requestInterceptorChain.shift();
    try {
      newConfig = onFulfilled(newConfig);
    } catch (error) {
      onRejected(error);
      break;
    }
  }

  try {
    promise = dispatchRequest(newConfig);
  } catch (error) {
    return Promise.reject(error);
  }

  while (responseInterceptorChain.length) {
    promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  var fullPath = buildFullPath(config.baseURL, config.url);
  return buildURL(fullPath, config.params, config.paramsSerializer);
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/

  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method: method,
        headers: isForm ? {
          'Content-Type': 'multipart/form-data'
        } : {},
        url: url,
        data: data
      }));
    };
  }

  Axios.prototype[method] = generateHTTPMethod();

  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
});

module.exports = Axios;

},{"../helpers/buildURL":54,"../helpers/validator":66,"./../utils":67,"./InterceptorManager":44,"./buildFullPath":45,"./dispatchRequest":46,"./mergeConfig":47}],43:[function(require,module,exports){
'use strict';

var utils = require('../utils');

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [config] The config.
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
function AxiosError(message, code, config, request, response) {
  Error.call(this);
  this.message = message;
  this.name = 'AxiosError';
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  response && (this.response = response);
}

utils.inherits(AxiosError, Error, {
  toJSON: function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  }
});

var prototype = AxiosError.prototype;
var descriptors = {};

[
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_DEPRECATED',
  'ERR_BAD_RESPONSE',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED'
// eslint-disable-next-line func-names
].forEach(function(code) {
  descriptors[code] = {value: code};
});

Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype, 'isAxiosError', {value: true});

// eslint-disable-next-line func-names
AxiosError.from = function(error, code, config, request, response, customProps) {
  var axiosError = Object.create(prototype);

  utils.toFlatObject(error, axiosError, function filter(obj) {
    return obj !== Error.prototype;
  });

  AxiosError.call(axiosError, error.message, code, config, request, response);

  axiosError.name = error.name;

  customProps && Object.assign(axiosError, customProps);

  return axiosError;
};

module.exports = AxiosError;

},{"../utils":67}],44:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected,
    synchronous: options ? options.synchronous : false,
    runWhen: options ? options.runWhen : null
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":67}],45:[function(require,module,exports){
'use strict';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};

},{"../helpers/combineURLs":55,"../helpers/isAbsoluteURL":57}],46:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');
var CanceledError = require('../cancel/CanceledError');

/**
 * Throws a `CanceledError` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new CanceledError();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData.call(
    config,
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};

},{"../cancel/CanceledError":40,"../cancel/isCancel":41,"../defaults":50,"./../utils":67,"./transformData":49}],47:[function(require,module,exports){
'use strict';

var utils = require('../utils');

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge(target, source);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  // eslint-disable-next-line consistent-return
  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function mergeDirectKeys(prop) {
    if (prop in config2) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  var mergeMap = {
    'url': valueFromConfig2,
    'method': valueFromConfig2,
    'data': valueFromConfig2,
    'baseURL': defaultToConfig2,
    'transformRequest': defaultToConfig2,
    'transformResponse': defaultToConfig2,
    'paramsSerializer': defaultToConfig2,
    'timeout': defaultToConfig2,
    'timeoutMessage': defaultToConfig2,
    'withCredentials': defaultToConfig2,
    'adapter': defaultToConfig2,
    'responseType': defaultToConfig2,
    'xsrfCookieName': defaultToConfig2,
    'xsrfHeaderName': defaultToConfig2,
    'onUploadProgress': defaultToConfig2,
    'onDownloadProgress': defaultToConfig2,
    'decompress': defaultToConfig2,
    'maxContentLength': defaultToConfig2,
    'maxBodyLength': defaultToConfig2,
    'beforeRedirect': defaultToConfig2,
    'transport': defaultToConfig2,
    'httpAgent': defaultToConfig2,
    'httpsAgent': defaultToConfig2,
    'cancelToken': defaultToConfig2,
    'socketPath': defaultToConfig2,
    'responseEncoding': defaultToConfig2,
    'validateStatus': mergeDirectKeys
  };

  utils.forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop) {
    var merge = mergeMap[prop] || mergeDeepProperties;
    var configValue = merge(prop);
    (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
  });

  return config;
};

},{"../utils":67}],48:[function(require,module,exports){
'use strict';

var AxiosError = require('./AxiosError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError(
      'Request failed with status code ' + response.status,
      [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
};

},{"./AxiosError":43}],49:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var defaults = require('../defaults');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  var context = this || defaults;
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn.call(context, data, headers);
  });

  return data;
};

},{"../defaults":50,"./../utils":67}],50:[function(require,module,exports){
(function (process){(function (){
'use strict';

var utils = require('../utils');
var normalizeHeaderName = require('../helpers/normalizeHeaderName');
var AxiosError = require('../core/AxiosError');
var transitionalDefaults = require('./transitional');
var toFormData = require('../helpers/toFormData');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('../adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('../adapters/http');
  }
  return adapter;
}

function stringifySafely(rawValue, parser, encoder) {
  if (utils.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils.trim(rawValue);
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

var defaults = {

  transitional: transitionalDefaults,

  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');

    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }

    var isObjectPayload = utils.isObject(data);
    var contentType = headers && headers['Content-Type'];

    var isFileList;

    if ((isFileList = utils.isFileList(data)) || (isObjectPayload && contentType === 'multipart/form-data')) {
      var _FormData = this.env && this.env.FormData;
      return toFormData(isFileList ? {'files[]': data} : data, _FormData && new _FormData());
    } else if (isObjectPayload || contentType === 'application/json') {
      setContentTypeIfUnset(headers, 'application/json');
      return stringifySafely(data);
    }

    return data;
  }],

  transformResponse: [function transformResponse(data) {
    var transitional = this.transitional || defaults.transitional;
    var silentJSONParsing = transitional && transitional.silentJSONParsing;
    var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    var strictJSONParsing = !silentJSONParsing && this.responseType === 'json';

    if (strictJSONParsing || (forcedJSONParsing && utils.isString(data) && data.length)) {
      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === 'SyntaxError') {
            throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e;
        }
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  env: {
    FormData: require('./env/FormData')
  },

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },

  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;

}).call(this)}).call(this,require('_process'))
},{"../adapters/http":37,"../adapters/xhr":37,"../core/AxiosError":43,"../helpers/normalizeHeaderName":60,"../helpers/toFormData":65,"../utils":67,"./env/FormData":61,"./transitional":51,"_process":4}],51:[function(require,module,exports){
'use strict';

module.exports = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false
};

},{}],52:[function(require,module,exports){
module.exports = {
  "version": "0.27.2"
};
},{}],53:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

},{}],54:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"./../utils":67}],55:[function(require,module,exports){
'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

},{}],56:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);

},{"./../utils":67}],57:[function(require,module,exports){
'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
};

},{}],58:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
module.exports = function isAxiosError(payload) {
  return utils.isObject(payload) && (payload.isAxiosError === true);
};

},{"./../utils":67}],59:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
      function resolveURL(url) {
        var href = url;

        if (msie) {
        // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);

},{"./../utils":67}],60:[function(require,module,exports){
'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

},{"../utils":67}],61:[function(require,module,exports){
// eslint-disable-next-line strict
module.exports = null;

},{}],62:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

},{"./../utils":67}],63:[function(require,module,exports){
'use strict';

module.exports = function parseProtocol(url) {
  var match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || '';
};

},{}],64:[function(require,module,exports){
'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],65:[function(require,module,exports){
(function (Buffer){(function (){
'use strict';

var utils = require('../utils');

/**
 * Convert a data object to FormData
 * @param {Object} obj
 * @param {?Object} [formData]
 * @returns {Object}
 **/

function toFormData(obj, formData) {
  // eslint-disable-next-line no-param-reassign
  formData = formData || new FormData();

  var stack = [];

  function convertValue(value) {
    if (value === null) return '';

    if (utils.isDate(value)) {
      return value.toISOString();
    }

    if (utils.isArrayBuffer(value) || utils.isTypedArray(value)) {
      return typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
    }

    return value;
  }

  function build(data, parentKey) {
    if (utils.isPlainObject(data) || utils.isArray(data)) {
      if (stack.indexOf(data) !== -1) {
        throw Error('Circular reference detected in ' + parentKey);
      }

      stack.push(data);

      utils.forEach(data, function each(value, key) {
        if (utils.isUndefined(value)) return;
        var fullKey = parentKey ? parentKey + '.' + key : key;
        var arr;

        if (value && !parentKey && typeof value === 'object') {
          if (utils.endsWith(key, '{}')) {
            // eslint-disable-next-line no-param-reassign
            value = JSON.stringify(value);
          } else if (utils.endsWith(key, '[]') && (arr = utils.toArray(value))) {
            // eslint-disable-next-line func-names
            arr.forEach(function(el) {
              !utils.isUndefined(el) && formData.append(fullKey, convertValue(el));
            });
            return;
          }
        }

        build(value, fullKey);
      });

      stack.pop();
    } else {
      formData.append(parentKey, convertValue(data));
    }
  }

  build(obj);

  return formData;
}

module.exports = toFormData;

}).call(this)}).call(this,require("buffer").Buffer)
},{"../utils":67,"buffer":2}],66:[function(require,module,exports){
'use strict';

var VERSION = require('../env/data').version;
var AxiosError = require('../core/AxiosError');

var validators = {};

// eslint-disable-next-line func-names
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach(function(type, i) {
  validators[type] = function validator(thing) {
    return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
  };
});

var deprecatedWarnings = {};

/**
 * Transitional option validator
 * @param {function|boolean?} validator - set to false if the transitional option has been removed
 * @param {string?} version - deprecated version / removed since version
 * @param {string?} message - some message with additional info
 * @returns {function}
 */
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
  }

  // eslint-disable-next-line func-names
  return function(value, opt, opts) {
    if (validator === false) {
      throw new AxiosError(
        formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
        AxiosError.ERR_DEPRECATED
      );
    }

    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      // eslint-disable-next-line no-console
      console.warn(
        formatMessage(
          opt,
          ' has been deprecated since v' + version + ' and will be removed in the near future'
        )
      );
    }

    return validator ? validator(value, opt, opts) : true;
  };
};

/**
 * Assert object's properties type
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 */

function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== 'object') {
    throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
  }
  var keys = Object.keys(options);
  var i = keys.length;
  while (i-- > 0) {
    var opt = keys[i];
    var validator = schema[opt];
    if (validator) {
      var value = options[opt];
      var result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
    }
  }
}

module.exports = {
  assertOptions: assertOptions,
  validators: validators
};

},{"../core/AxiosError":43,"../env/data":52}],67:[function(require,module,exports){
'use strict';

var bind = require('./helpers/bind');

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

// eslint-disable-next-line func-names
var kindOf = (function(cache) {
  // eslint-disable-next-line func-names
  return function(thing) {
    var str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
  };
})(Object.create(null));

function kindOfTest(type) {
  type = type.toLowerCase();
  return function isKindOf(thing) {
    return kindOf(thing) === type;
  };
}

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return Array.isArray(val);
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
var isArrayBuffer = kindOfTest('ArrayBuffer');


/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (kindOf(val) !== 'object') {
    return false;
  }

  var prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
var isDate = kindOfTest('Date');

/**
 * Determine if a value is a File
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFile = kindOfTest('File');

/**
 * Determine if a value is a Blob
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
var isBlob = kindOfTest('Blob');

/**
 * Determine if a value is a FileList
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFileList = kindOfTest('FileList');

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} thing The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(thing) {
  var pattern = '[object FormData]';
  return thing && (
    (typeof FormData === 'function' && thing instanceof FormData) ||
    toString.call(thing) === pattern ||
    (isFunction(thing.toString) && thing.toString() === pattern)
  );
}

/**
 * Determine if a value is a URLSearchParams object
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
var isURLSearchParams = kindOfTest('URLSearchParams');

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                           navigator.product === 'NativeScript' ||
                                           navigator.product === 'NS')) {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

/**
 * Inherit the prototype methods from one constructor into another
 * @param {function} constructor
 * @param {function} superConstructor
 * @param {object} [props]
 * @param {object} [descriptors]
 */

function inherits(constructor, superConstructor, props, descriptors) {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  constructor.prototype.constructor = constructor;
  props && Object.assign(constructor.prototype, props);
}

/**
 * Resolve object with deep prototype chain to a flat object
 * @param {Object} sourceObj source object
 * @param {Object} [destObj]
 * @param {Function} [filter]
 * @returns {Object}
 */

function toFlatObject(sourceObj, destObj, filter) {
  var props;
  var i;
  var prop;
  var merged = {};

  destObj = destObj || {};

  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if (!merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = Object.getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

  return destObj;
}

/*
 * determines whether a string ends with the characters of a specified string
 * @param {String} str
 * @param {String} searchString
 * @param {Number} [position= 0]
 * @returns {boolean}
 */
function endsWith(str, searchString, position) {
  str = String(str);
  if (position === undefined || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  var lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
}


/**
 * Returns new array from array like object
 * @param {*} [thing]
 * @returns {Array}
 */
function toArray(thing) {
  if (!thing) return null;
  var i = thing.length;
  if (isUndefined(i)) return null;
  var arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
}

// eslint-disable-next-line func-names
var isTypedArray = (function(TypedArray) {
  // eslint-disable-next-line func-names
  return function(thing) {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== 'undefined' && Object.getPrototypeOf(Uint8Array));

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM,
  inherits: inherits,
  toFlatObject: toFlatObject,
  kindOf: kindOf,
  kindOfTest: kindOfTest,
  endsWith: endsWith,
  toArray: toArray,
  isTypedArray: isTypedArray,
  isFileList: isFileList
};

},{"./helpers/bind":53}],68:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelCase = exports.camelCaseTransformMerge = exports.camelCaseTransform = void 0;
var tslib_1 = require("tslib");
var pascal_case_1 = require("pascal-case");
function camelCaseTransform(input, index) {
    if (index === 0)
        return input.toLowerCase();
    return pascal_case_1.pascalCaseTransform(input, index);
}
exports.camelCaseTransform = camelCaseTransform;
function camelCaseTransformMerge(input, index) {
    if (index === 0)
        return input.toLowerCase();
    return pascal_case_1.pascalCaseTransformMerge(input);
}
exports.camelCaseTransformMerge = camelCaseTransformMerge;
function camelCase(input, options) {
    if (options === void 0) { options = {}; }
    return pascal_case_1.pascalCase(input, tslib_1.__assign({ transform: camelCaseTransform }, options));
}
exports.camelCase = camelCase;

},{"pascal-case":75,"tslib":111}],69:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalCase = exports.capitalCaseTransform = void 0;
var tslib_1 = require("tslib");
var no_case_1 = require("no-case");
var upper_case_first_1 = require("upper-case-first");
function capitalCaseTransform(input) {
    return upper_case_first_1.upperCaseFirst(input.toLowerCase());
}
exports.capitalCaseTransform = capitalCaseTransform;
function capitalCase(input, options) {
    if (options === void 0) { options = {}; }
    return no_case_1.noCase(input, tslib_1.__assign({ delimiter: " ", transform: capitalCaseTransform }, options));
}
exports.capitalCase = capitalCase;

},{"no-case":74,"tslib":111,"upper-case-first":112}],70:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dotCase = void 0;
var tslib_1 = require("tslib");
var no_case_1 = require("no-case");
function dotCase(input, options) {
    if (options === void 0) { options = {}; }
    return no_case_1.noCase(input, tslib_1.__assign({ delimiter: "." }, options));
}
exports.dotCase = dotCase;

},{"no-case":74,"tslib":111}],71:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.headerCase = void 0;
var tslib_1 = require("tslib");
var capital_case_1 = require("capital-case");
function headerCase(input, options) {
    if (options === void 0) { options = {}; }
    return capital_case_1.capitalCase(input, tslib_1.__assign({ delimiter: "-" }, options));
}
exports.headerCase = headerCase;

},{"capital-case":69,"tslib":111}],72:[function(require,module,exports){
'use strict';

const denyList = new Set([
	'ENOTFOUND',
	'ENETUNREACH',

	// SSL errors from https://github.com/nodejs/node/blob/fc8e3e2cdc521978351de257030db0076d79e0ab/src/crypto/crypto_common.cc#L301-L328
	'UNABLE_TO_GET_ISSUER_CERT',
	'UNABLE_TO_GET_CRL',
	'UNABLE_TO_DECRYPT_CERT_SIGNATURE',
	'UNABLE_TO_DECRYPT_CRL_SIGNATURE',
	'UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY',
	'CERT_SIGNATURE_FAILURE',
	'CRL_SIGNATURE_FAILURE',
	'CERT_NOT_YET_VALID',
	'CERT_HAS_EXPIRED',
	'CRL_NOT_YET_VALID',
	'CRL_HAS_EXPIRED',
	'ERROR_IN_CERT_NOT_BEFORE_FIELD',
	'ERROR_IN_CERT_NOT_AFTER_FIELD',
	'ERROR_IN_CRL_LAST_UPDATE_FIELD',
	'ERROR_IN_CRL_NEXT_UPDATE_FIELD',
	'OUT_OF_MEM',
	'DEPTH_ZERO_SELF_SIGNED_CERT',
	'SELF_SIGNED_CERT_IN_CHAIN',
	'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
	'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
	'CERT_CHAIN_TOO_LONG',
	'CERT_REVOKED',
	'INVALID_CA',
	'PATH_LENGTH_EXCEEDED',
	'INVALID_PURPOSE',
	'CERT_UNTRUSTED',
	'CERT_REJECTED',
	'HOSTNAME_MISMATCH'
]);

// TODO: Use `error?.code` when targeting Node.js 14
module.exports = error => !denyList.has(error && error.code);

},{}],73:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lowerCase = exports.localeLowerCase = void 0;
/**
 * Source: ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
 */
var SUPPORTED_LOCALE = {
    tr: {
        regexp: /\u0130|\u0049|\u0049\u0307/g,
        map: {
            İ: "\u0069",
            I: "\u0131",
            İ: "\u0069",
        },
    },
    az: {
        regexp: /\u0130/g,
        map: {
            İ: "\u0069",
            I: "\u0131",
            İ: "\u0069",
        },
    },
    lt: {
        regexp: /\u0049|\u004A|\u012E|\u00CC|\u00CD|\u0128/g,
        map: {
            I: "\u0069\u0307",
            J: "\u006A\u0307",
            Į: "\u012F\u0307",
            Ì: "\u0069\u0307\u0300",
            Í: "\u0069\u0307\u0301",
            Ĩ: "\u0069\u0307\u0303",
        },
    },
};
/**
 * Localized lower case.
 */
function localeLowerCase(str, locale) {
    var lang = SUPPORTED_LOCALE[locale.toLowerCase()];
    if (lang)
        return lowerCase(str.replace(lang.regexp, function (m) { return lang.map[m]; }));
    return lowerCase(str);
}
exports.localeLowerCase = localeLowerCase;
/**
 * Lower case as a function.
 */
function lowerCase(str) {
    return str.toLowerCase();
}
exports.lowerCase = lowerCase;

},{}],74:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noCase = void 0;
var lower_case_1 = require("lower-case");
// Support camel case ("camelCase" -> "camel Case" and "CAMELCase" -> "CAMEL Case").
var DEFAULT_SPLIT_REGEXP = [/([a-z0-9])([A-Z])/g, /([A-Z])([A-Z][a-z])/g];
// Remove all non-word characters.
var DEFAULT_STRIP_REGEXP = /[^A-Z0-9]+/gi;
/**
 * Normalize the string into something other libraries can manipulate easier.
 */
function noCase(input, options) {
    if (options === void 0) { options = {}; }
    var _a = options.splitRegexp, splitRegexp = _a === void 0 ? DEFAULT_SPLIT_REGEXP : _a, _b = options.stripRegexp, stripRegexp = _b === void 0 ? DEFAULT_STRIP_REGEXP : _b, _c = options.transform, transform = _c === void 0 ? lower_case_1.lowerCase : _c, _d = options.delimiter, delimiter = _d === void 0 ? " " : _d;
    var result = replace(replace(input, splitRegexp, "$1\0$2"), stripRegexp, "\0");
    var start = 0;
    var end = result.length;
    // Trim the delimiter from around the output string.
    while (result.charAt(start) === "\0")
        start++;
    while (result.charAt(end - 1) === "\0")
        end--;
    // Transform each token independently.
    return result.slice(start, end).split("\0").map(transform).join(delimiter);
}
exports.noCase = noCase;
/**
 * Replace `re` in the input string with the replacement value.
 */
function replace(input, re, value) {
    if (re instanceof RegExp)
        return input.replace(re, value);
    return re.reduce(function (input, re) { return input.replace(re, value); }, input);
}

},{"lower-case":73}],75:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pascalCase = exports.pascalCaseTransformMerge = exports.pascalCaseTransform = void 0;
var tslib_1 = require("tslib");
var no_case_1 = require("no-case");
function pascalCaseTransform(input, index) {
    var firstChar = input.charAt(0);
    var lowerChars = input.substr(1).toLowerCase();
    if (index > 0 && firstChar >= "0" && firstChar <= "9") {
        return "_" + firstChar + lowerChars;
    }
    return "" + firstChar.toUpperCase() + lowerChars;
}
exports.pascalCaseTransform = pascalCaseTransform;
function pascalCaseTransformMerge(input) {
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}
exports.pascalCaseTransformMerge = pascalCaseTransformMerge;
function pascalCase(input, options) {
    if (options === void 0) { options = {}; }
    return no_case_1.noCase(input, tslib_1.__assign({ delimiter: "", transform: pascalCaseTransform }, options));
}
exports.pascalCase = pascalCase;

},{"no-case":74,"tslib":111}],76:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncContract = void 0;
var errors_1 = require("./errors");
var util_1 = require("./util");
function AsyncContract() {
    var runtypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        runtypes[_i] = arguments[_i];
    }
    var lastIndex = runtypes.length - 1;
    var argRuntypes = runtypes.slice(0, lastIndex);
    var returnRuntype = runtypes[lastIndex];
    return {
        enforce: function (f) { return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (args.length < argRuntypes.length) {
                var message = "Expected ".concat(argRuntypes.length, " arguments but only received ").concat(args.length);
                var failure = util_1.FAILURE.ARGUMENT_INCORRECT(message);
                throw new errors_1.ValidationError(failure);
            }
            for (var i = 0; i < argRuntypes.length; i++)
                argRuntypes[i].check(args[i]);
            var returnedPromise = f.apply(void 0, __spreadArray([], __read(args), false));
            if (!(returnedPromise instanceof Promise)) {
                var message = "Expected function to return a promise, but instead got ".concat(returnedPromise);
                var failure = util_1.FAILURE.RETURN_INCORRECT(message);
                throw new errors_1.ValidationError(failure);
            }
            return returnedPromise.then(returnRuntype.check);
        }; },
    };
}
exports.AsyncContract = AsyncContract;

},{"./errors":79,"./util":108}],77:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = void 0;
var errors_1 = require("./errors");
var util_1 = require("./util");
function Contract() {
    var runtypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        runtypes[_i] = arguments[_i];
    }
    var lastIndex = runtypes.length - 1;
    var argRuntypes = runtypes.slice(0, lastIndex);
    var returnRuntype = runtypes[lastIndex];
    return {
        enforce: function (f) { return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (args.length < argRuntypes.length) {
                var message = "Expected ".concat(argRuntypes.length, " arguments but only received ").concat(args.length);
                var failure = util_1.FAILURE.ARGUMENT_INCORRECT(message);
                throw new errors_1.ValidationError(failure);
            }
            for (var i = 0; i < argRuntypes.length; i++)
                argRuntypes[i].check(args[i]);
            return returnRuntype.check(f.apply(void 0, __spreadArray([], __read(args), false)));
        }; },
    };
}
exports.Contract = Contract;

},{"./errors":79,"./util":108}],78:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checked = exports.check = void 0;
var errors_1 = require("./errors");
var util_1 = require("./util");
var prototypes = new WeakMap();
/**
 * A parameter decorator. Explicitly mark the parameter as checked on every method call in combination with `@checked` method decorator. The number of `@check` params must be the same as the number of provided runtypes into `@checked`.\
 * Usage:
 * ```ts
 * @checked(Runtype1, Runtype3)
 * method(@check p1: Static1, p2: number, @check p3: Static3) { ... }
 * ```
 */
function check(target, propertyKey, parameterIndex) {
    var prototype = prototypes.get(target) || new Map();
    prototypes.set(target, prototype);
    var validParameterIndices = prototype.get(propertyKey) || [];
    prototype.set(propertyKey, validParameterIndices);
    validParameterIndices.push(parameterIndex);
}
exports.check = check;
function getValidParameterIndices(target, propertyKey, runtypeCount) {
    var prototype = prototypes.get(target);
    var validParameterIndices = prototype && prototype.get(propertyKey);
    if (validParameterIndices) {
        // used with `@check` parameter decorator
        return validParameterIndices;
    }
    var indices = [];
    for (var i = 0; i < runtypeCount; i++) {
        indices.push(i);
    }
    return indices;
}
/**
 * A method decorator. Takes runtypes as arguments which correspond to the ones of the actual method.
 *
 * Usually, the number of provided runtypes must be _**the same as**_ or _**less than**_ the actual parameters.
 *
 * If you explicitly mark which parameter shall be checked using `@check` parameter decorator, the number of `@check` parameters must be _**the same as**_ the runtypes provided into `@checked`.
 *
 * Usage:
 * ```ts
 * @checked(Runtype1, Runtype2)
 * method1(param1: Static1, param2: Static2, param3: any) {
 *   ...
 * }
 *
 * @checked(Runtype1, Runtype3)
 * method2(@check param1: Static1, param2: any, @check param3: Static3) {
 *   ...
 * }
 * ```
 */
function checked() {
    var runtypes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        runtypes[_i] = arguments[_i];
    }
    if (runtypes.length === 0) {
        throw new Error('No runtype provided to `@checked`. Please remove the decorator.');
    }
    return function (target, propertyKey, descriptor) {
        var method = descriptor.value;
        var methodId = (target.name || target.constructor.name + '.prototype') +
            (typeof propertyKey === 'string' ? "[\"".concat(propertyKey, "\"]") : "[".concat(String(propertyKey), "]"));
        var validParameterIndices = getValidParameterIndices(target, propertyKey, runtypes.length);
        if (validParameterIndices.length !== runtypes.length) {
            throw new Error('Number of `@checked` runtypes and @check parameters not matched.');
        }
        if (validParameterIndices.length > method.length) {
            throw new Error('Number of `@checked` runtypes exceeds actual parameter length.');
        }
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            runtypes.forEach(function (type, typeIndex) {
                var parameterIndex = validParameterIndices[typeIndex];
                var result = type.validate(args[parameterIndex]);
                if (!result.success) {
                    var message = "".concat(methodId, ", argument #").concat(parameterIndex, ": ").concat(result.message);
                    var failure = util_1.FAILURE.ARGUMENT_INCORRECT(message);
                    throw new errors_1.ValidationError(failure);
                }
            });
            return method.apply(this, args);
        };
    };
}
exports.checked = checked;

},{"./errors":79,"./util":108}],79:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(failure) {
        var _this = _super.call(this, failure.message) || this;
        _this.name = 'ValidationError';
        _this.code = failure.code;
        if (failure.details !== undefined)
            _this.details = failure.details;
        Object.setPrototypeOf(_this, ValidationError.prototype);
        return _this;
    }
    return ValidationError;
}(Error));
exports.ValidationError = ValidationError;

},{}],80:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceOf = exports.Nullish = exports.Null = exports.Undefined = exports.Literal = void 0;
__exportStar(require("./reflect"), exports);
__exportStar(require("./result"), exports);
__exportStar(require("./contract"), exports);
__exportStar(require("./asynccontract"), exports);
__exportStar(require("./match"), exports);
__exportStar(require("./errors"), exports);
__exportStar(require("./types/unknown"), exports);
__exportStar(require("./types/never"), exports);
__exportStar(require("./types/void"), exports);
var literal_1 = require("./types/literal");
Object.defineProperty(exports, "Literal", { enumerable: true, get: function () { return literal_1.Literal; } });
Object.defineProperty(exports, "Undefined", { enumerable: true, get: function () { return literal_1.Undefined; } });
Object.defineProperty(exports, "Null", { enumerable: true, get: function () { return literal_1.Null; } });
Object.defineProperty(exports, "Nullish", { enumerable: true, get: function () { return literal_1.Nullish; } });
__exportStar(require("./types/template"), exports);
__exportStar(require("./types/boolean"), exports);
__exportStar(require("./types/number"), exports);
__exportStar(require("./types/bigint"), exports);
__exportStar(require("./types/string"), exports);
__exportStar(require("./types/symbol"), exports);
__exportStar(require("./types/array"), exports);
__exportStar(require("./types/tuple"), exports);
__exportStar(require("./types/record"), exports);
__exportStar(require("./types/dictionary"), exports);
__exportStar(require("./types/union"), exports);
__exportStar(require("./types/intersect"), exports);
__exportStar(require("./types/optional"), exports);
__exportStar(require("./types/function"), exports);
var instanceof_1 = require("./types/instanceof");
Object.defineProperty(exports, "InstanceOf", { enumerable: true, get: function () { return instanceof_1.InstanceOf; } });
__exportStar(require("./types/lazy"), exports);
__exportStar(require("./types/constraint"), exports);
__exportStar(require("./types/brand"), exports);
__exportStar(require("./decorator"), exports);

},{"./asynccontract":76,"./contract":77,"./decorator":78,"./errors":79,"./match":81,"./reflect":82,"./result":83,"./types/array":86,"./types/bigint":87,"./types/boolean":88,"./types/brand":89,"./types/constraint":90,"./types/dictionary":91,"./types/function":92,"./types/instanceof":93,"./types/intersect":94,"./types/lazy":95,"./types/literal":96,"./types/never":97,"./types/number":98,"./types/optional":99,"./types/record":100,"./types/string":101,"./types/symbol":102,"./types/template":103,"./types/tuple":104,"./types/union":105,"./types/unknown":106,"./types/void":107}],81:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.when = exports.match = void 0;
function match() {
    var cases = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        cases[_i] = arguments[_i];
    }
    return function (x) {
        var e_1, _a;
        try {
            for (var cases_1 = __values(cases), cases_1_1 = cases_1.next(); !cases_1_1.done; cases_1_1 = cases_1.next()) {
                var _b = __read(cases_1_1.value, 2), T = _b[0], f = _b[1];
                if (T.guard(x))
                    return f(x);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (cases_1_1 && !cases_1_1.done && (_a = cases_1.return)) _a.call(cases_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        throw new Error('No alternatives were matched');
    };
}
exports.match = match;
function when(runtype, transformer) {
    return [runtype, transformer];
}
exports.when = when;

},{}],82:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],83:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Failcode = void 0;
exports.Failcode = {
    /** The type of the received primitive value is incompatible with expected one. */
    TYPE_INCORRECT: 'TYPE_INCORRECT',
    /** The received primitive value is incorrect. */
    VALUE_INCORRECT: 'VALUE_INCORRECT',
    /** The key of the property is incorrect. */
    KEY_INCORRECT: 'KEY_INCORRECT',
    /** One or more elements or properties of the received object are incorrect. */
    CONTENT_INCORRECT: 'CONTENT_INCORRECT',
    /** One or more arguments passed to the function is incorrect. */
    ARGUMENT_INCORRECT: 'ARGUMENT_INCORRECT',
    /** The value returned by the function is incorrect. */
    RETURN_INCORRECT: 'RETURN_INCORRECT',
    /** The received value does not fulfill the constraint. */
    CONSTRAINT_FAILED: 'CONSTRAINT_FAILED',
    /** The property must be present but missing. */
    PROPERTY_MISSING: 'PROPERTY_MISSING',
    /** The property must not be present but present. */
    PROPERTY_PRESENT: 'PROPERTY_PRESENT',
    /** The value must not be present but present. */
    NOTHING_EXPECTED: 'NOTHING_EXPECTED',
};

},{}],84:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.innerValidate = exports.create = exports.isRuntype = void 0;
var index_1 = require("./index");
var show_1 = require("./show");
var errors_1 = require("./errors");
var util_1 = require("./util");
var RuntypeSymbol = Symbol();
var isRuntype = function (x) { return (0, util_1.hasKey)(RuntypeSymbol, x); };
exports.isRuntype = isRuntype;
function create(validate, A) {
    A[RuntypeSymbol] = true;
    A.check = check;
    A.assert = check;
    A._innerValidate = function (value, visited) {
        if (visited.has(value, A))
            return (0, util_1.SUCCESS)(value);
        return validate(value, visited);
    };
    A.validate = function (value) { return A._innerValidate(value, VisitedState()); };
    A.guard = guard;
    A.Or = Or;
    A.And = And;
    A.optional = optional;
    A.nullable = nullable;
    A.withConstraint = withConstraint;
    A.withGuard = withGuard;
    A.withBrand = withBrand;
    A.reflect = A;
    A.toString = function () { return "Runtype<".concat((0, show_1.default)(A), ">"); };
    return A;
    function check(x) {
        var result = A.validate(x);
        if (result.success)
            return result.value;
        else
            throw new errors_1.ValidationError(result);
    }
    function guard(x) {
        return A.validate(x).success;
    }
    function Or(B) {
        return (0, index_1.Union)(A, B);
    }
    function And(B) {
        return (0, index_1.Intersect)(A, B);
    }
    function optional() {
        return (0, index_1.Optional)(A);
    }
    function nullable() {
        return (0, index_1.Union)(A, index_1.Null);
    }
    function withConstraint(constraint, options) {
        return (0, index_1.Constraint)(A, constraint, options);
    }
    function withGuard(guard, options) {
        return (0, index_1.Constraint)(A, guard, options);
    }
    function withBrand(B) {
        return (0, index_1.Brand)(B, A);
    }
}
exports.create = create;
function innerValidate(targetType, value, visited) {
    return targetType._innerValidate(value, visited);
}
exports.innerValidate = innerValidate;
function VisitedState() {
    var members = new WeakMap();
    var add = function (candidate, type) {
        if (candidate === null || !(typeof candidate === 'object'))
            return;
        var typeSet = members.get(candidate);
        members.set(candidate, typeSet
            ? typeSet.set(type, true)
            : new WeakMap().set(type, true));
    };
    var has = function (candidate, type) {
        var typeSet = members.get(candidate);
        var value = (typeSet && typeSet.get(type)) || false;
        add(candidate, type);
        return value;
    };
    return { has: has };
}

},{"./errors":79,"./index":80,"./show":85,"./util":108}],85:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Return the display string for the stringified version of a type, e.g.
 *
 * - `Number` -> `` `${number}` ``
 * - `String` -> `string`
 * - `Literal(42)` -> `"42"`
 * - `Union(Literal("foo"), Number)` -> `` "foo" | `${number}` ``
 */
var showStringified = function (circular) { return function (refl) {
    switch (refl.tag) {
        case 'literal':
            return "\"".concat(String(refl.value), "\"");
        case 'string':
            return 'string';
        case 'brand':
            return refl.brand;
        case 'constraint':
            return refl.name || showStringified(circular)(refl.underlying);
        case 'union':
            return refl.alternatives.map(showStringified(circular)).join(' | ');
        case 'intersect':
            return refl.intersectees.map(showStringified(circular)).join(' & ');
        default:
            break;
    }
    return "`${".concat(show(false, circular)(refl), "}`");
}; };
/**
 * Return the display string which is to be embedded into the display string of
 * the surrounding template literal type, e.g.
 *
 * - `Number` -> `${number}`
 * - `String` -> `${string}`
 * - `Literal("foo")` -> `foo`
 * - `Union(Literal(42), Number)` -> `${"42" | number}`
 */
var showEmbedded = function (circular) { return function (refl) {
    switch (refl.tag) {
        case 'literal':
            return String(refl.value);
        case 'brand':
            return "${".concat(refl.brand, "}");
        case 'constraint':
            return refl.name ? "${".concat(refl.name, "}") : showEmbedded(circular)(refl.underlying);
        case 'union':
            if (refl.alternatives.length === 1) {
                var inner = refl.alternatives[0];
                return showEmbedded(circular)(inner.reflect);
            }
            break;
        case 'intersect':
            if (refl.intersectees.length === 1) {
                var inner = refl.intersectees[0];
                return showEmbedded(circular)(inner.reflect);
            }
            break;
        default:
            break;
    }
    return "${".concat(show(false, circular)(refl), "}");
}; };
var show = function (needsParens, circular) { return function (refl) {
    var parenthesize = function (s) { return (needsParens ? "(".concat(s, ")") : s); };
    if (circular.has(refl))
        return parenthesize("CIRCULAR ".concat(refl.tag));
    else
        circular.add(refl);
    try {
        switch (refl.tag) {
            // Primitive types
            case 'unknown':
            case 'never':
            case 'void':
            case 'boolean':
            case 'number':
            case 'bigint':
            case 'string':
            case 'symbol':
            case 'function':
                return refl.tag;
            case 'literal': {
                var value = refl.value;
                return typeof value === 'string' ? "\"".concat(value, "\"") : String(value);
            }
            // Complex types
            case 'template': {
                if (refl.strings.length === 0)
                    return '""';
                else if (refl.strings.length === 1)
                    return "\"".concat(refl.strings[0], "\"");
                else if (refl.strings.length === 2) {
                    if (refl.strings.every(function (string) { return string === ''; })) {
                        var runtype = refl.runtypes[0];
                        return showStringified(circular)(runtype.reflect);
                    }
                }
                var backtick_1 = false;
                var inner = refl.strings.reduce(function (inner, string, i) {
                    var prefix = inner + string;
                    var runtype = refl.runtypes[i];
                    if (runtype) {
                        var suffix = showEmbedded(circular)(runtype.reflect);
                        if (!backtick_1 && suffix.startsWith('$'))
                            backtick_1 = true;
                        return prefix + suffix;
                    }
                    else
                        return prefix;
                }, '');
                return backtick_1 ? "`".concat(inner, "`") : "\"".concat(inner, "\"");
            }
            case 'array':
                return "".concat(readonlyTag(refl)).concat(show(true, circular)(refl.element), "[]");
            case 'dictionary':
                return "{ [_: ".concat(refl.key, "]: ").concat(show(false, circular)(refl.value), " }");
            case 'record': {
                var keys = Object.keys(refl.fields);
                return keys.length
                    ? "{ ".concat(keys
                        .map(function (k) {
                        return "".concat(readonlyTag(refl)).concat(k).concat(partialTag(refl, k), ": ").concat(refl.fields[k].tag === 'optional'
                            ? show(false, circular)(refl.fields[k].underlying)
                            : show(false, circular)(refl.fields[k]), ";");
                    })
                        .join(' '), " }")
                    : '{}';
            }
            case 'tuple':
                return "[".concat(refl.components.map(show(false, circular)).join(', '), "]");
            case 'union':
                return parenthesize("".concat(refl.alternatives.map(show(true, circular)).join(' | ')));
            case 'intersect':
                return parenthesize("".concat(refl.intersectees.map(show(true, circular)).join(' & ')));
            case 'optional':
                return show(needsParens, circular)(refl.underlying) + ' | undefined';
            case 'constraint':
                return refl.name || show(needsParens, circular)(refl.underlying);
            case 'instanceof':
                return refl.ctor.name;
            case 'brand':
                return show(needsParens, circular)(refl.entity);
        }
    }
    finally {
        circular.delete(refl);
    }
    /* istanbul ignore next */
    throw Error('impossible');
}; };
exports.default = show(false, new Set());
function partialTag(_a, key) {
    var isPartial = _a.isPartial, fields = _a.fields;
    return isPartial || (key !== undefined && fields[key].tag === 'optional') ? '?' : '';
}
function readonlyTag(_a) {
    var isReadonly = _a.isReadonly;
    return isReadonly ? 'readonly ' : '';
}

},{}],86:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Array = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
/**
 * Construct an array runtype from a runtype for its elements.
 */
function InternalArr(element, isReadonly) {
    var self = { tag: 'array', isReadonly: isReadonly, element: element };
    return withExtraModifierFuncs((0, runtype_1.create)(function (xs, visited) {
        if (!Array.isArray(xs))
            return util_1.FAILURE.TYPE_INCORRECT(self, xs);
        var keys = (0, util_1.enumerableKeysOf)(xs);
        var results = keys.map(function (key) {
            return (0, runtype_1.innerValidate)(element, xs[key], visited);
        });
        var details = keys.reduce(function (details, key) {
            var result = results[key];
            if (!result.success)
                details[key] = result.details || result.message;
            return details;
        }, []);
        if ((0, util_1.enumerableKeysOf)(details).length !== 0)
            return util_1.FAILURE.CONTENT_INCORRECT(self, details);
        else
            return (0, util_1.SUCCESS)(xs);
    }, self));
}
function Arr(element) {
    return InternalArr(element, false);
}
exports.Array = Arr;
function withExtraModifierFuncs(A) {
    A.asReadonly = asReadonly;
    return A;
    function asReadonly() {
        return InternalArr(A.element, true);
    }
}

},{"../runtype":84,"../util":108}],87:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigInt = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
var self = { tag: 'bigint' };
/**
 * Validates that a value is a bigint.
 */
exports.BigInt = (0, runtype_1.create)(function (value) { return (typeof value === 'bigint' ? (0, util_1.SUCCESS)(value) : util_1.FAILURE.TYPE_INCORRECT(self, value)); }, self);

},{"../runtype":84,"../util":108}],88:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Boolean = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
var self = { tag: 'boolean' };
/**
 * Validates that a value is a boolean.
 */
exports.Boolean = (0, runtype_1.create)(function (value) { return (typeof value === 'boolean' ? (0, util_1.SUCCESS)(value) : util_1.FAILURE.TYPE_INCORRECT(self, value)); }, self);

},{"../runtype":84,"../util":108}],89:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
var runtype_1 = require("../runtype");
function Brand(brand, entity) {
    var self = { tag: 'brand', brand: brand, entity: entity };
    return (0, runtype_1.create)(function (value) { return entity.validate(value); }, self);
}
exports.Brand = Brand;

},{"../runtype":84}],90:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guard = exports.Constraint = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
var unknown_1 = require("./unknown");
function Constraint(underlying, constraint, options) {
    var name = options && options.name;
    var args = options && options.args;
    var self = {
        tag: 'constraint',
        underlying: underlying,
        constraint: constraint,
        name: name,
        args: args,
    };
    return (0, runtype_1.create)(function (value) {
        var result = underlying.validate(value);
        if (!result.success)
            return result;
        var message = constraint(result.value);
        if (typeof message === 'string')
            return util_1.FAILURE.CONSTRAINT_FAILED(self, message);
        else if (!message)
            return util_1.FAILURE.CONSTRAINT_FAILED(self);
        return (0, util_1.SUCCESS)(result.value);
    }, self);
}
exports.Constraint = Constraint;
var Guard = function (guard, options) { return unknown_1.Unknown.withGuard(guard, options); };
exports.Guard = Guard;

},{"../runtype":84,"../util":108,"./unknown":106}],91:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dictionary = void 0;
var runtype_1 = require("../runtype");
var string_1 = require("./string");
var constraint_1 = require("./constraint");
var show_1 = require("../show");
var util_1 = require("../util");
var NumberKey = (0, constraint_1.Constraint)(string_1.String, function (s) { return !isNaN(+s); }, { name: 'number' });
function Dictionary(value, key) {
    var keyRuntype = key === undefined
        ? string_1.String
        : key === 'string'
            ? string_1.String
            : key === 'number'
                ? NumberKey
                : key;
    var keyString = (0, show_1.default)(keyRuntype);
    var self = { tag: 'dictionary', key: keyString, value: value };
    return (0, runtype_1.create)(function (x, visited) {
        if (x === null || x === undefined || typeof x !== 'object')
            return util_1.FAILURE.TYPE_INCORRECT(self, x);
        if (Object.getPrototypeOf(x) !== Object.prototype)
            if (!Array.isArray(x) || keyString === 'string')
                return util_1.FAILURE.TYPE_INCORRECT(self, x);
        var numberString = /^(?:NaN|-?\d+(?:\.\d+)?)$/;
        var keys = (0, util_1.enumerableKeysOf)(x);
        var results = keys.reduce(function (results, key) {
            // We should provide interoperability with `number` and `string` here,
            // as a user would expect JavaScript engines to convert numeric keys to
            // string keys automatically. So, if the key can be interpreted as a
            // decimal number, then test it against a `Number` OR `String` runtype.
            var isNumberLikeKey = typeof key === 'string' && numberString.test(key);
            var keyInterop = isNumberLikeKey ? globalThis.Number(key) : key;
            if (isNumberLikeKey
                ? !keyRuntype.guard(keyInterop) && !keyRuntype.guard(key)
                : !keyRuntype.guard(keyInterop)) {
                results[key] = util_1.FAILURE.KEY_INCORRECT(self, keyRuntype.reflect, keyInterop);
            }
            else
                results[key] = (0, runtype_1.innerValidate)(value, x[key], visited);
            return results;
        }, {});
        var details = keys.reduce(function (details, key) {
            var result = results[key];
            if (!result.success)
                details[key] = result.details || result.message;
            return details;
        }, {});
        if ((0, util_1.enumerableKeysOf)(details).length !== 0)
            return util_1.FAILURE.CONTENT_INCORRECT(self, details);
        else
            return (0, util_1.SUCCESS)(x);
    }, self);
}
exports.Dictionary = Dictionary;

},{"../runtype":84,"../show":85,"../util":108,"./constraint":90,"./string":101}],92:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Function = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
var self = { tag: 'function' };
/**
 * Construct a runtype for functions.
 */
exports.Function = (0, runtype_1.create)(function (value) { return (typeof value === 'function' ? (0, util_1.SUCCESS)(value) : util_1.FAILURE.TYPE_INCORRECT(self, value)); }, self);

},{"../runtype":84,"../util":108}],93:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceOf = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
function InstanceOf(ctor) {
    var self = { tag: 'instanceof', ctor: ctor };
    return (0, runtype_1.create)(function (value) { return (value instanceof ctor ? (0, util_1.SUCCESS)(value) : util_1.FAILURE.TYPE_INCORRECT(self, value)); }, self);
}
exports.InstanceOf = InstanceOf;

},{"../runtype":84,"../util":108}],94:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Intersect = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
/**
 * Construct an intersection runtype from runtypes for its alternatives.
 */
function Intersect() {
    var intersectees = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        intersectees[_i] = arguments[_i];
    }
    var self = { tag: 'intersect', intersectees: intersectees };
    return (0, runtype_1.create)(function (value, visited) {
        var e_1, _a;
        try {
            for (var intersectees_1 = __values(intersectees), intersectees_1_1 = intersectees_1.next(); !intersectees_1_1.done; intersectees_1_1 = intersectees_1.next()) {
                var targetType = intersectees_1_1.value;
                var result = (0, runtype_1.innerValidate)(targetType, value, visited);
                if (!result.success)
                    return result;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (intersectees_1_1 && !intersectees_1_1.done && (_a = intersectees_1.return)) _a.call(intersectees_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return (0, util_1.SUCCESS)(value);
    }, self);
}
exports.Intersect = Intersect;

},{"../runtype":84,"../util":108}],95:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lazy = void 0;
var runtype_1 = require("../runtype");
/**
 * Construct a possibly-recursive Runtype.
 */
function Lazy(delayed) {
    var data = {
        get tag() {
            return getWrapped()['tag'];
        },
    };
    var cached;
    function getWrapped() {
        if (!cached) {
            cached = delayed();
            for (var k in cached)
                if (k !== 'tag')
                    data[k] = cached[k];
        }
        return cached;
    }
    return (0, runtype_1.create)(function (x) {
        return getWrapped().validate(x);
    }, data);
}
exports.Lazy = Lazy;

},{"../runtype":84}],96:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nullish = exports.Null = exports.Undefined = exports.Literal = exports.literal = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
var union_1 = require("./union");
/**
 * Be aware of an Array of Symbols `[Symbol()]` which would throw "TypeError: Cannot convert a Symbol value to a string"
 */
function literal(value) {
    return Array.isArray(value)
        ? String(value.map(String))
        : typeof value === 'bigint'
            ? String(value) + 'n'
            : String(value);
}
exports.literal = literal;
/**
 * Construct a runtype for a type literal.
 */
function Literal(valueBase) {
    var self = { tag: 'literal', value: valueBase };
    return (0, runtype_1.create)(function (value) {
        return value === valueBase
            ? (0, util_1.SUCCESS)(value)
            : util_1.FAILURE.VALUE_INCORRECT('literal', "`".concat(literal(valueBase), "`"), "`".concat(literal(value), "`"));
    }, self);
}
exports.Literal = Literal;
/**
 * An alias for Literal(undefined).
 */
exports.Undefined = Literal(undefined);
/**
 * An alias for Literal(null).
 */
exports.Null = Literal(null);
/**
 * An alias for `Union(Null, Undefined)`.
 */
exports.Nullish = (0, union_1.Union)(exports.Null, exports.Undefined);

},{"../runtype":84,"../util":108,"./union":105}],97:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Never = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
var self = { tag: 'never' };
/**
 * Validates nothing (unknown fails).
 */
exports.Never = (0, runtype_1.create)(util_1.FAILURE.NOTHING_EXPECTED, self);

},{"../runtype":84,"../util":108}],98:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Number = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
var self = { tag: 'number' };
/**
 * Validates that a value is a number.
 */
exports.Number = (0, runtype_1.create)(function (value) { return (typeof value === 'number' ? (0, util_1.SUCCESS)(value) : util_1.FAILURE.TYPE_INCORRECT(self, value)); }, self);

},{"../runtype":84,"../util":108}],99:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Optional = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
/**
 * Validates optional value.
 */
function Optional(runtype) {
    var self = { tag: 'optional', underlying: runtype };
    return (0, runtype_1.create)(function (value) { return (value === undefined ? (0, util_1.SUCCESS)(value) : runtype.validate(value)); }, self);
}
exports.Optional = Optional;

},{"../runtype":84,"../util":108}],100:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Partial = exports.Record = exports.InternalRecord = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
/**
 * Construct a record runtype from runtypes for its values.
 */
function InternalRecord(fields, isPartial, isReadonly) {
    var self = { tag: 'record', isPartial: isPartial, isReadonly: isReadonly, fields: fields };
    return withExtraModifierFuncs((0, runtype_1.create)(function (x, visited) {
        if (x === null || x === undefined) {
            return util_1.FAILURE.TYPE_INCORRECT(self, x);
        }
        var keysOfFields = (0, util_1.enumerableKeysOf)(fields);
        if (keysOfFields.length !== 0 && typeof x !== 'object')
            return util_1.FAILURE.TYPE_INCORRECT(self, x);
        var keys = __spreadArray([], __read(new Set(__spreadArray(__spreadArray([], __read(keysOfFields), false), __read((0, util_1.enumerableKeysOf)(x)), false))), false);
        var results = keys.reduce(function (results, key) {
            var fieldsHasKey = (0, util_1.hasKey)(key, fields);
            var xHasKey = (0, util_1.hasKey)(key, x);
            if (fieldsHasKey) {
                var runtype = fields[key];
                var isOptional = isPartial || runtype.reflect.tag === 'optional';
                if (xHasKey) {
                    var value = x[key];
                    if (isOptional && value === undefined)
                        results[key] = (0, util_1.SUCCESS)(value);
                    else
                        results[key] = (0, runtype_1.innerValidate)(runtype, value, visited);
                }
                else {
                    if (!isOptional)
                        results[key] = util_1.FAILURE.PROPERTY_MISSING(runtype.reflect);
                    else
                        results[key] = (0, util_1.SUCCESS)(undefined);
                }
            }
            else if (xHasKey) {
                // TODO: exact record validation
                var value = x[key];
                results[key] = (0, util_1.SUCCESS)(value);
            }
            else {
                /* istanbul ignore next */
                throw new Error('impossible');
            }
            return results;
        }, {});
        var details = keys.reduce(function (details, key) {
            var result = results[key];
            if (!result.success)
                details[key] = result.details || result.message;
            return details;
        }, {});
        if ((0, util_1.enumerableKeysOf)(details).length !== 0)
            return util_1.FAILURE.CONTENT_INCORRECT(self, details);
        else
            return (0, util_1.SUCCESS)(x);
    }, self));
}
exports.InternalRecord = InternalRecord;
function Record(fields) {
    return InternalRecord(fields, false, false);
}
exports.Record = Record;
function Partial(fields) {
    return InternalRecord(fields, true, false);
}
exports.Partial = Partial;
function withExtraModifierFuncs(A) {
    A.asPartial = asPartial;
    A.asReadonly = asReadonly;
    A.pick = pick;
    A.omit = omit;
    A.extend = extend;
    return A;
    function asPartial() {
        return InternalRecord(A.fields, true, A.isReadonly);
    }
    function asReadonly() {
        return InternalRecord(A.fields, A.isPartial, true);
    }
    function pick() {
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        var result = {};
        keys.forEach(function (key) {
            result[key] = A.fields[key];
        });
        return InternalRecord(result, A.isPartial, A.isReadonly);
    }
    function omit() {
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        var result = {};
        var existingKeys = (0, util_1.enumerableKeysOf)(A.fields);
        existingKeys.forEach(function (key) {
            if (!keys.includes(key))
                result[key] = A.fields[key];
        });
        return InternalRecord(result, A.isPartial, A.isReadonly);
    }
    function extend(fields) {
        return InternalRecord(Object.assign({}, A.fields, fields), A.isPartial, A.isReadonly);
    }
}

},{"../runtype":84,"../util":108}],101:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.String = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
var self = { tag: 'string' };
/**
 * Validates that a value is a string.
 */
exports.String = (0, runtype_1.create)(function (value) { return (typeof value === 'string' ? (0, util_1.SUCCESS)(value) : util_1.FAILURE.TYPE_INCORRECT(self, value)); }, self);

},{"../runtype":84,"../util":108}],102:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Symbol = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
var f = function (key) {
    var self = { tag: 'symbol', key: key };
    return (0, runtype_1.create)(function (value) {
        if (typeof value !== 'symbol')
            return util_1.FAILURE.TYPE_INCORRECT(self, value);
        else {
            var keyForValue = globalThis.Symbol.keyFor(value);
            if (keyForValue !== key)
                return util_1.FAILURE.VALUE_INCORRECT('symbol key', quoteIfPresent(key), quoteIfPresent(keyForValue));
            else
                return (0, util_1.SUCCESS)(value);
        }
    }, self);
};
var self = { tag: 'symbol' };
/**
 * Validates that a value is a symbol, regardless of whether it is keyed or not.
 */
exports.Symbol = (0, runtype_1.create)(function (value) { return (typeof value === 'symbol' ? (0, util_1.SUCCESS)(value) : util_1.FAILURE.TYPE_INCORRECT(self, value)); }, Object.assign(f, self));
var quoteIfPresent = function (key) { return (key === undefined ? 'undefined' : "\"".concat(key, "\"")); };

},{"../runtype":84,"../util":108}],103:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = void 0;
var runtype_1 = require("../runtype");
var show_1 = require("../show");
var util_1 = require("../util");
var literal_1 = require("./literal");
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
var escapeRegExp = function (string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
var parseArgs = function (args) {
    // If the first element is an `Array`, maybe it's called by the tagged style
    if (0 < args.length && Array.isArray(args[0])) {
        var _a = __read(args), strings = _a[0], runtypes = _a.slice(1);
        // For further manipulation, recreate an `Array` because `TemplateStringsArray` is readonly
        return [Array.from(strings), runtypes];
    }
    else {
        var convenient = args;
        var strings = convenient.reduce(function (strings, arg) {
            // Concatenate every consecutive literals as strings
            if (!(0, runtype_1.isRuntype)(arg))
                strings.push(strings.pop() + String(arg));
            // Skip runtypes
            else
                strings.push('');
            return strings;
        }, ['']);
        var runtypes = convenient.filter(runtype_1.isRuntype);
        return [strings, runtypes];
    }
};
/**
 * Flatten inner runtypes of a `Template` if possible, with in-place strategy
 */
var flattenInnerRuntypes = function (strings, runtypes) {
    for (var i = 0; i < runtypes.length;) {
        switch (runtypes[i].reflect.tag) {
            case 'literal': {
                var literal_2 = runtypes[i];
                runtypes.splice(i, 1);
                var string = String(literal_2.value);
                strings.splice(i, 2, strings[i] + string + strings[i + 1]);
                break;
            }
            case 'template': {
                var template = runtypes[i];
                runtypes.splice.apply(runtypes, __spreadArray([i, 1], __read(template.runtypes), false));
                var innerStrings = template.strings;
                if (innerStrings.length === 1) {
                    strings.splice(i, 2, strings[i] + innerStrings[0] + strings[i + 1]);
                }
                else {
                    var first = innerStrings[0];
                    var rest = innerStrings.slice(1, -1);
                    var last = innerStrings[innerStrings.length - 1];
                    strings.splice.apply(strings, __spreadArray(__spreadArray([i, 2, strings[i] + first], __read(rest), false), [last + strings[i + 1]], false));
                }
                break;
            }
            case 'union': {
                var union = runtypes[i];
                if (union.alternatives.length === 1) {
                    try {
                        var literal_3 = getInnerLiteral(union);
                        runtypes.splice(i, 1);
                        var string = String(literal_3.value);
                        strings.splice(i, 2, strings[i] + string + strings[i + 1]);
                        break;
                    }
                    catch (_) {
                        i++;
                        break;
                    }
                }
                else {
                    i++;
                    break;
                }
            }
            case 'intersect': {
                var intersect = runtypes[i];
                if (intersect.intersectees.length === 1) {
                    try {
                        var literal_4 = getInnerLiteral(intersect);
                        runtypes.splice(i, 1);
                        var string = String(literal_4.value);
                        strings.splice(i, 2, strings[i] + string + strings[i + 1]);
                        break;
                    }
                    catch (_) {
                        i++;
                        break;
                    }
                }
                else {
                    i++;
                    break;
                }
            }
            default:
                i++;
                break;
        }
    }
};
var normalizeArgs = function (args) {
    var _a = __read(parseArgs(args), 2), strings = _a[0], runtypes = _a[1];
    flattenInnerRuntypes(strings, runtypes);
    return [strings, runtypes];
};
var getInnerLiteral = function (runtype) {
    switch (runtype.reflect.tag) {
        case 'literal':
            return runtype;
        case 'brand':
            return getInnerLiteral(runtype.reflect.entity);
        case 'union':
            if (runtype.reflect.alternatives.length === 1)
                return getInnerLiteral(runtype.reflect.alternatives[0]);
            break;
        case 'intersect':
            if (runtype.reflect.intersectees.length === 1)
                return getInnerLiteral(runtype.reflect.intersectees[0]);
            break;
        default:
            break;
    }
    throw undefined;
};
var identity = function (s) { return s; };
var revivers = {
    string: [function (s) { return globalThis.String(s); }, '.*'],
    number: [
        function (s) { return globalThis.Number(s); },
        '[+-]?(?:\\d*\\.\\d+|\\d+\\.\\d*|\\d+)(?:[Ee][+-]?\\d+)?',
        '0[Bb][01]+',
        '0[Oo][0-7]+',
        '0[Xx][0-9A-Fa-f]+',
        // Note: `"NaN"` isn't here, as TS doesn't allow `"NaN"` to be a `` `${number}` ``
    ],
    bigint: [function (s) { return globalThis.BigInt(s); }, '-?[1-9]d*'],
    boolean: [function (s) { return (s === 'false' ? false : true); }, 'true', 'false'],
    null: [function () { return null; }, 'null'],
    undefined: [function () { return undefined; }, 'undefined'],
};
var getReviversFor = function (reflect) {
    switch (reflect.tag) {
        case 'literal': {
            var _a = __read(revivers[(0, util_1.typeOf)(reflect.value)] || [identity], 1), reviver_1 = _a[0];
            return reviver_1;
        }
        case 'brand':
            return getReviversFor(reflect.entity);
        case 'constraint':
            return getReviversFor(reflect.underlying);
        case 'union':
            return reflect.alternatives.map(getReviversFor);
        case 'intersect':
            return reflect.intersectees.map(getReviversFor);
        default:
            var _b = __read(revivers[reflect.tag] || [identity], 1), reviver = _b[0];
            return reviver;
    }
};
/** Recursively map corresponding reviver and  */
var reviveValidate = function (reflect, visited) { return function (value) {
    var e_1, _a, e_2, _b;
    var revivers = getReviversFor(reflect);
    if (Array.isArray(revivers)) {
        switch (reflect.tag) {
            case 'union':
                try {
                    for (var _c = __values(reflect.alternatives), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var alternative = _d.value;
                        var validated = reviveValidate(alternative.reflect, visited)(value);
                        if (validated.success)
                            return validated;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return util_1.FAILURE.TYPE_INCORRECT(reflect, value);
            case 'intersect':
                try {
                    for (var _e = __values(reflect.intersectees), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var intersectee = _f.value;
                        var validated = reviveValidate(intersectee.reflect, visited)(value);
                        if (!validated.success)
                            return validated;
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                return (0, util_1.SUCCESS)(value);
            default:
                /* istanbul ignore next */
                throw Error('impossible');
        }
    }
    else {
        var reviver = revivers;
        var validated = (0, runtype_1.innerValidate)(reflect, reviver(value), visited);
        if (!validated.success && validated.code === 'VALUE_INCORRECT' && reflect.tag === 'literal')
            // TODO: Temporary fix to show unrevived value in message; needs refactor
            return util_1.FAILURE.VALUE_INCORRECT('literal', "\"".concat((0, literal_1.literal)(reflect.value), "\""), "\"".concat(value, "\""));
        return validated;
    }
}; };
var getRegExpPatternFor = function (reflect) {
    switch (reflect.tag) {
        case 'literal':
            return escapeRegExp(String(reflect.value));
        case 'brand':
            return getRegExpPatternFor(reflect.entity);
        case 'constraint':
            return getRegExpPatternFor(reflect.underlying);
        case 'union':
            return reflect.alternatives.map(getRegExpPatternFor).join('|');
        case 'template': {
            return reflect.strings.map(escapeRegExp).reduce(function (pattern, string, i) {
                var prefix = pattern + string;
                var runtype = reflect.runtypes[i];
                if (runtype)
                    return prefix + "(?:".concat(getRegExpPatternFor(runtype.reflect), ")");
                else
                    return prefix;
            }, '');
        }
        default:
            var _a = __read(revivers[reflect.tag] || [undefined, '.*']), patterns = _a.slice(1);
            return patterns.join('|');
    }
};
var createRegExpForTemplate = function (reflect) {
    var pattern = reflect.strings.map(escapeRegExp).reduce(function (pattern, string, i) {
        var prefix = pattern + string;
        var runtype = reflect.runtypes[i];
        if (runtype)
            return prefix + "(".concat(getRegExpPatternFor(runtype.reflect), ")");
        else
            return prefix;
    }, '');
    return new RegExp("^".concat(pattern, "$"), 'su');
};
function Template() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var _a = __read(normalizeArgs(args), 2), strings = _a[0], runtypes = _a[1];
    var self = { tag: 'template', strings: strings, runtypes: runtypes };
    var regexp = createRegExpForTemplate(self);
    var test = function (value, visited) {
        var matches = value.match(regexp);
        if (matches) {
            var values = matches.slice(1);
            for (var i = 0; i < runtypes.length; i++) {
                var runtype = runtypes[i];
                var value_1 = values[i];
                var validated = reviveValidate(runtype.reflect, visited)(value_1);
                if (!validated.success)
                    return validated;
            }
            return (0, util_1.SUCCESS)(value);
        }
        else {
            return util_1.FAILURE.VALUE_INCORRECT('string', "".concat((0, show_1.default)(self)), "\"".concat((0, literal_1.literal)(value), "\""));
        }
    };
    return (0, runtype_1.create)(function (value, visited) {
        if (typeof value !== 'string')
            return util_1.FAILURE.TYPE_INCORRECT(self, value);
        else {
            var validated = test(value, visited);
            if (!validated.success) {
                var result = util_1.FAILURE.VALUE_INCORRECT('string', "".concat((0, show_1.default)(self)), "\"".concat(value, "\""));
                if (result.message !== validated.message)
                    // TODO: Should use `details` here, but it needs unionizing `string` anew to the definition of `Details`, which is a breaking change
                    result.message += " (inner: ".concat(validated.message, ")");
                return result;
            }
            else
                return (0, util_1.SUCCESS)(value);
        }
    }, self);
}
exports.Template = Template;

},{"../runtype":84,"../show":85,"../util":108,"./literal":96}],104:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tuple = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
/**
 * Construct a tuple runtype from runtypes for each of its elements.
 */
function Tuple() {
    var components = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        components[_i] = arguments[_i];
    }
    var self = { tag: 'tuple', components: components };
    return (0, runtype_1.create)(function (xs, visited) {
        if (!Array.isArray(xs))
            return util_1.FAILURE.TYPE_INCORRECT(self, xs);
        if (xs.length !== components.length)
            return util_1.FAILURE.CONSTRAINT_FAILED(self, "Expected length ".concat(components.length, ", but was ").concat(xs.length));
        var keys = (0, util_1.enumerableKeysOf)(xs);
        var results = keys.map(function (key) {
            return (0, runtype_1.innerValidate)(components[key], xs[key], visited);
        });
        var details = keys.reduce(function (details, key) {
            var result = results[key];
            if (!result.success)
                details[key] = result.details || result.message;
            return details;
        }, []);
        if ((0, util_1.enumerableKeysOf)(details).length !== 0)
            return util_1.FAILURE.CONTENT_INCORRECT(self, details);
        else
            return (0, util_1.SUCCESS)(xs);
    }, self);
}
exports.Tuple = Tuple;

},{"../runtype":84,"../util":108}],105:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Union = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
/**
 * Construct a union runtype from runtypes for its alternatives.
 */
function Union() {
    var alternatives = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        alternatives[_i] = arguments[_i];
    }
    var match = function () {
        var cases = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            cases[_i] = arguments[_i];
        }
        return function (x) {
            for (var i = 0; i < alternatives.length; i++) {
                if (alternatives[i].guard(x)) {
                    return cases[i](x);
                }
            }
        };
    };
    var self = { tag: 'union', alternatives: alternatives, match: match };
    return (0, runtype_1.create)(function (value, visited) {
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d;
        if (typeof value !== 'object' || value === null) {
            try {
                for (var alternatives_1 = __values(alternatives), alternatives_1_1 = alternatives_1.next(); !alternatives_1_1.done; alternatives_1_1 = alternatives_1.next()) {
                    var alternative = alternatives_1_1.value;
                    if ((0, runtype_1.innerValidate)(alternative, value, visited).success)
                        return (0, util_1.SUCCESS)(value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (alternatives_1_1 && !alternatives_1_1.done && (_a = alternatives_1.return)) _a.call(alternatives_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return util_1.FAILURE.TYPE_INCORRECT(self, value);
        }
        var commonLiteralFields = {};
        try {
            for (var alternatives_2 = __values(alternatives), alternatives_2_1 = alternatives_2.next(); !alternatives_2_1.done; alternatives_2_1 = alternatives_2.next()) {
                var alternative = alternatives_2_1.value;
                if (alternative.reflect.tag === 'record') {
                    var _loop_1 = function (fieldName) {
                        var field = alternative.reflect.fields[fieldName];
                        if (field.tag === 'literal') {
                            if (commonLiteralFields[fieldName]) {
                                if (commonLiteralFields[fieldName].every(function (value) { return value !== field.value; })) {
                                    commonLiteralFields[fieldName].push(field.value);
                                }
                            }
                            else {
                                commonLiteralFields[fieldName] = [field.value];
                            }
                        }
                    };
                    for (var fieldName in alternative.reflect.fields) {
                        _loop_1(fieldName);
                    }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (alternatives_2_1 && !alternatives_2_1.done && (_b = alternatives_2.return)) _b.call(alternatives_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        for (var fieldName in commonLiteralFields) {
            if (commonLiteralFields[fieldName].length === alternatives.length) {
                try {
                    for (var alternatives_3 = (e_3 = void 0, __values(alternatives)), alternatives_3_1 = alternatives_3.next(); !alternatives_3_1.done; alternatives_3_1 = alternatives_3.next()) {
                        var alternative = alternatives_3_1.value;
                        if (alternative.reflect.tag === 'record') {
                            var field = alternative.reflect.fields[fieldName];
                            if (field.tag === 'literal' &&
                                (0, util_1.hasKey)(fieldName, value) &&
                                value[fieldName] === field.value) {
                                return (0, runtype_1.innerValidate)(alternative, value, visited);
                            }
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (alternatives_3_1 && !alternatives_3_1.done && (_c = alternatives_3.return)) _c.call(alternatives_3);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
        }
        try {
            for (var alternatives_4 = __values(alternatives), alternatives_4_1 = alternatives_4.next(); !alternatives_4_1.done; alternatives_4_1 = alternatives_4.next()) {
                var targetType = alternatives_4_1.value;
                if ((0, runtype_1.innerValidate)(targetType, value, visited).success)
                    return (0, util_1.SUCCESS)(value);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (alternatives_4_1 && !alternatives_4_1.done && (_d = alternatives_4.return)) _d.call(alternatives_4);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return util_1.FAILURE.TYPE_INCORRECT(self, value);
    }, self);
}
exports.Union = Union;

},{"../runtype":84,"../util":108}],106:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unknown = void 0;
var runtype_1 = require("../runtype");
var util_1 = require("../util");
var self = { tag: 'unknown' };
/**
 * Validates anything, but provides no new type information about it.
 */
exports.Unknown = (0, runtype_1.create)(function (value) { return (0, util_1.SUCCESS)(value); }, self);

},{"../runtype":84,"../util":108}],107:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Void = void 0;
var unknown_1 = require("./unknown");
/**
 * Void is an alias for Unknown
 *
 * @deprecated Please use Unknown instead
 */
exports.Void = unknown_1.Unknown;

},{"./unknown":106}],108:[function(require,module,exports){
"use strict";
// Type guard to determine if an object has a given key
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAILURE = exports.SUCCESS = exports.enumerableKeysOf = exports.typeOf = exports.hasKey = void 0;
var result_1 = require("./result");
var show_1 = require("./show");
// If this feature gets implemented, we can use `in` instead: https://github.com/Microsoft/TypeScript/issues/10485
function hasKey(key, object) {
    return typeof object === 'object' && object !== null && key in object;
}
exports.hasKey = hasKey;
var typeOf = function (value) {
    var _a, _b, _c;
    return typeof value === 'object'
        ? value === null
            ? 'null'
            : Array.isArray(value)
                ? 'array'
                : ((_a = value.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'Object'
                    ? 'object'
                    : (_c = (_b = value.constructor) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : typeof value
        : typeof value;
};
exports.typeOf = typeOf;
var enumerableKeysOf = function (object) {
    return typeof object === 'object' && object !== null
        ? // Objects with a null prototype may not have `propertyIsEnumerable`
            Reflect.ownKeys(object).filter(function (key) { var _a, _b; return (_b = (_a = object.propertyIsEnumerable) === null || _a === void 0 ? void 0 : _a.call(object, key)) !== null && _b !== void 0 ? _b : true; })
        : [];
};
exports.enumerableKeysOf = enumerableKeysOf;
function SUCCESS(value) {
    return { success: true, value: value };
}
exports.SUCCESS = SUCCESS;
exports.FAILURE = Object.assign(function (code, message, details) { return (__assign({ success: false, code: code, message: message }, (details ? { details: details } : {}))); }, {
    TYPE_INCORRECT: function (self, value) {
        var message = "Expected ".concat(self.tag === 'template' ? "string ".concat((0, show_1.default)(self)) : (0, show_1.default)(self), ", but was ").concat((0, exports.typeOf)(value));
        return (0, exports.FAILURE)(result_1.Failcode.TYPE_INCORRECT, message);
    },
    VALUE_INCORRECT: function (name, expected, received) {
        return (0, exports.FAILURE)(result_1.Failcode.VALUE_INCORRECT, "Expected ".concat(name, " ").concat(String(expected), ", but was ").concat(String(received)));
    },
    KEY_INCORRECT: function (self, expected, value) {
        return (0, exports.FAILURE)(result_1.Failcode.KEY_INCORRECT, "Expected ".concat((0, show_1.default)(self), " key to be ").concat((0, show_1.default)(expected), ", but was ").concat((0, exports.typeOf)(value)));
    },
    CONTENT_INCORRECT: function (self, details) {
        var formattedDetails = JSON.stringify(details, null, 2).replace(/^ *null,\n/gm, '');
        var message = "Validation failed:\n".concat(formattedDetails, ".\nObject should match ").concat((0, show_1.default)(self));
        return (0, exports.FAILURE)(result_1.Failcode.CONTENT_INCORRECT, message, details);
    },
    ARGUMENT_INCORRECT: function (message) {
        return (0, exports.FAILURE)(result_1.Failcode.ARGUMENT_INCORRECT, message);
    },
    RETURN_INCORRECT: function (message) {
        return (0, exports.FAILURE)(result_1.Failcode.RETURN_INCORRECT, message);
    },
    CONSTRAINT_FAILED: function (self, message) {
        var info = message ? ": ".concat(message) : '';
        return (0, exports.FAILURE)(result_1.Failcode.CONSTRAINT_FAILED, "Failed constraint check for ".concat((0, show_1.default)(self)).concat(info));
    },
    PROPERTY_MISSING: function (self) {
        var message = "Expected ".concat((0, show_1.default)(self), ", but was missing");
        return (0, exports.FAILURE)(result_1.Failcode.PROPERTY_MISSING, message);
    },
    PROPERTY_PRESENT: function (value) {
        var message = "Expected nothing, but was ".concat((0, exports.typeOf)(value));
        return (0, exports.FAILURE)(result_1.Failcode.PROPERTY_PRESENT, message);
    },
    NOTHING_EXPECTED: function (value) {
        var message = "Expected nothing, but was ".concat((0, exports.typeOf)(value));
        return (0, exports.FAILURE)(result_1.Failcode.NOTHING_EXPECTED, message);
    },
});

},{"./result":83,"./show":85}],109:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snakeCase = void 0;
var tslib_1 = require("tslib");
var dot_case_1 = require("dot-case");
function snakeCase(input, options) {
    if (options === void 0) { options = {}; }
    return dot_case_1.dotCase(input, tslib_1.__assign({ delimiter: "_" }, options));
}
exports.snakeCase = snakeCase;

},{"dot-case":70,"tslib":111}],110:[function(require,module,exports){
function fixProto(target, prototype) {
  var setPrototypeOf = Object.setPrototypeOf;
  setPrototypeOf ? setPrototypeOf(target, prototype) : target.__proto__ = prototype;
}
function fixStack(target, fn) {
  if (fn === void 0) {
    fn = target.constructor;
  }

  var captureStackTrace = Error.captureStackTrace;
  captureStackTrace && captureStackTrace(target, fn);
}

var __extends = undefined && undefined.__extends || function () {
  var _extendStatics = function extendStatics(d, b) {
    _extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) {
        if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
      }
    };

    return _extendStatics(d, b);
  };

  return function (d, b) {
    if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");

    _extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

var CustomError = function (_super) {
  __extends(CustomError, _super);

  function CustomError(message, options) {
    var _newTarget = this.constructor;

    var _this = _super.call(this, message, options) || this;

    Object.defineProperty(_this, 'name', {
      value: _newTarget.name,
      enumerable: false,
      configurable: true
    });
    fixProto(_this, _newTarget.prototype);
    fixStack(_this);
    return _this;
  }

  return CustomError;
}(Error);

var __spreadArray = undefined && undefined.__spreadArray || function (to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
function customErrorFactory(fn, parent) {
  if (parent === void 0) {
    parent = Error;
  }

  function CustomError() {
    var args = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }

    if (!(this instanceof CustomError)) return new (CustomError.bind.apply(CustomError, __spreadArray([void 0], args, false)))();
    parent.apply(this, args);
    Object.defineProperty(this, 'name', {
      value: fn.name || parent.name,
      enumerable: false,
      configurable: true
    });
    fn.apply(this, args);
    fixStack(this, CustomError);
  }

  return Object.defineProperties(CustomError, {
    prototype: {
      value: Object.create(parent.prototype, {
        constructor: {
          value: CustomError,
          writable: true,
          configurable: true
        }
      })
    }
  });
}

exports.CustomError = CustomError;
exports.customErrorFactory = customErrorFactory;


},{}],111:[function(require,module,exports){
(function (global){(function (){
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global global, define, Symbol, Reflect, Promise, SuppressedError */
var __extends;
var __assign;
var __rest;
var __decorate;
var __param;
var __esDecorate;
var __runInitializers;
var __propKey;
var __setFunctionName;
var __metadata;
var __awaiter;
var __generator;
var __exportStar;
var __values;
var __read;
var __spread;
var __spreadArrays;
var __spreadArray;
var __await;
var __asyncGenerator;
var __asyncDelegator;
var __asyncValues;
var __makeTemplateObject;
var __importStar;
var __importDefault;
var __classPrivateFieldGet;
var __classPrivateFieldSet;
var __classPrivateFieldIn;
var __createBinding;
var __addDisposableResource;
var __disposeResources;
(function (factory) {
    var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : {};
    if (typeof define === "function" && define.amd) {
        define("tslib", ["exports"], function (exports) { factory(createExporter(root, createExporter(exports))); });
    }
    else if (typeof module === "object" && typeof module.exports === "object") {
        factory(createExporter(root, createExporter(module.exports)));
    }
    else {
        factory(createExporter(root));
    }
    function createExporter(exports, previous) {
        if (exports !== root) {
            if (typeof Object.create === "function") {
                Object.defineProperty(exports, "__esModule", { value: true });
            }
            else {
                exports.__esModule = true;
            }
        }
        return function (id, v) { return exports[id] = previous ? previous(id, v) : v; };
    }
})
(function (exporter) {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };

    __extends = function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };

    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };

    __rest = function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    };

    __decorate = function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };

    __param = function (paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    };

    __esDecorate = function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
        function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
        var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
        var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
        var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
        var _, done = false;
        for (var i = decorators.length - 1; i >= 0; i--) {
            var context = {};
            for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
            for (var p in contextIn.access) context.access[p] = contextIn.access[p];
            context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
            var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
            if (kind === "accessor") {
                if (result === void 0) continue;
                if (result === null || typeof result !== "object") throw new TypeError("Object expected");
                if (_ = accept(result.get)) descriptor.get = _;
                if (_ = accept(result.set)) descriptor.set = _;
                if (_ = accept(result.init)) initializers.unshift(_);
            }
            else if (_ = accept(result)) {
                if (kind === "field") initializers.unshift(_);
                else descriptor[key] = _;
            }
        }
        if (target) Object.defineProperty(target, contextIn.name, descriptor);
        done = true;
    };

    __runInitializers = function (thisArg, initializers, value) {
        var useValue = arguments.length > 2;
        for (var i = 0; i < initializers.length; i++) {
            value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
        }
        return useValue ? value : void 0;
    };

    __propKey = function (x) {
        return typeof x === "symbol" ? x : "".concat(x);
    };

    __setFunctionName = function (f, name, prefix) {
        if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
        return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
    };

    __metadata = function (metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    };

    __awaiter = function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    __generator = function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (g && (g = 0, op[0] && (_ = 0)), _) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };

    __exportStar = function(m, o) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
    };

    __createBinding = Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
            desc = { enumerable: true, get: function() { return m[k]; } };
        }
        Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    });

    __values = function (o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };

    __read = function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };

    /** @deprecated */
    __spread = function () {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    };

    /** @deprecated */
    __spreadArrays = function () {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    };

    __spreadArray = function (to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    };

    __await = function (v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    };

    __asyncGenerator = function (thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    };

    __asyncDelegator = function (o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
    };

    __asyncValues = function (o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    };

    __makeTemplateObject = function (cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    var __setModuleDefault = Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
        o["default"] = v;
    };

    __importStar = function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };

    __importDefault = function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };

    __classPrivateFieldGet = function (receiver, state, kind, f) {
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };

    __classPrivateFieldSet = function (receiver, state, value, kind, f) {
        if (kind === "m") throw new TypeError("Private method is not writable");
        if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    };

    __classPrivateFieldIn = function (state, receiver) {
        if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
        return typeof state === "function" ? receiver === state : state.has(receiver);
    };

    __addDisposableResource = function (env, value, async) {
        if (value !== null && value !== void 0) {
            if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
            var dispose;
            if (async) {
                if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
                dispose = value[Symbol.asyncDispose];
            }
            if (dispose === void 0) {
                if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
                dispose = value[Symbol.dispose];
            }
            if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
            env.stack.push({ value: value, dispose: dispose, async: async });
        }
        else if (async) {
            env.stack.push({ async: true });
        }
        return value;
    };

    var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    __disposeResources = function (env) {
        function fail(e) {
            env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        function next() {
            while (env.stack.length) {
                var rec = env.stack.pop();
                try {
                    var result = rec.dispose && rec.dispose.call(rec.value);
                    if (rec.async) return Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                }
                catch (e) {
                    fail(e);
                }
            }
            if (env.hasError) throw env.error;
        }
        return next();
    };

    exporter("__extends", __extends);
    exporter("__assign", __assign);
    exporter("__rest", __rest);
    exporter("__decorate", __decorate);
    exporter("__param", __param);
    exporter("__esDecorate", __esDecorate);
    exporter("__runInitializers", __runInitializers);
    exporter("__propKey", __propKey);
    exporter("__setFunctionName", __setFunctionName);
    exporter("__metadata", __metadata);
    exporter("__awaiter", __awaiter);
    exporter("__generator", __generator);
    exporter("__exportStar", __exportStar);
    exporter("__createBinding", __createBinding);
    exporter("__values", __values);
    exporter("__read", __read);
    exporter("__spread", __spread);
    exporter("__spreadArrays", __spreadArrays);
    exporter("__spreadArray", __spreadArray);
    exporter("__await", __await);
    exporter("__asyncGenerator", __asyncGenerator);
    exporter("__asyncDelegator", __asyncDelegator);
    exporter("__asyncValues", __asyncValues);
    exporter("__makeTemplateObject", __makeTemplateObject);
    exporter("__importStar", __importStar);
    exporter("__importDefault", __importDefault);
    exporter("__classPrivateFieldGet", __classPrivateFieldGet);
    exporter("__classPrivateFieldSet", __classPrivateFieldSet);
    exporter("__classPrivateFieldIn", __classPrivateFieldIn);
    exporter("__addDisposableResource", __addDisposableResource);
    exporter("__disposeResources", __disposeResources);
});

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],112:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upperCaseFirst = void 0;
/**
 * Upper case the first character of an input string.
 */
function upperCaseFirst(input) {
    return input.charAt(0).toUpperCase() + input.substr(1);
}
exports.upperCaseFirst = upperCaseFirst;

},{}],113:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "NIL", {
  enumerable: true,
  get: function () {
    return _nil.default;
  }
});
Object.defineProperty(exports, "parse", {
  enumerable: true,
  get: function () {
    return _parse.default;
  }
});
Object.defineProperty(exports, "stringify", {
  enumerable: true,
  get: function () {
    return _stringify.default;
  }
});
Object.defineProperty(exports, "v1", {
  enumerable: true,
  get: function () {
    return _v.default;
  }
});
Object.defineProperty(exports, "v3", {
  enumerable: true,
  get: function () {
    return _v2.default;
  }
});
Object.defineProperty(exports, "v4", {
  enumerable: true,
  get: function () {
    return _v3.default;
  }
});
Object.defineProperty(exports, "v5", {
  enumerable: true,
  get: function () {
    return _v4.default;
  }
});
Object.defineProperty(exports, "validate", {
  enumerable: true,
  get: function () {
    return _validate.default;
  }
});
Object.defineProperty(exports, "version", {
  enumerable: true,
  get: function () {
    return _version.default;
  }
});

var _v = _interopRequireDefault(require("./v1.js"));

var _v2 = _interopRequireDefault(require("./v3.js"));

var _v3 = _interopRequireDefault(require("./v4.js"));

var _v4 = _interopRequireDefault(require("./v5.js"));

var _nil = _interopRequireDefault(require("./nil.js"));

var _version = _interopRequireDefault(require("./version.js"));

var _validate = _interopRequireDefault(require("./validate.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

var _parse = _interopRequireDefault(require("./parse.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
},{"./nil.js":116,"./parse.js":117,"./stringify.js":121,"./v1.js":122,"./v3.js":123,"./v4.js":125,"./v5.js":126,"./validate.js":127,"./version.js":128}],114:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
 * Browser-compatible JavaScript MD5
 *
 * Modification of JavaScript MD5
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 *
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
function md5(bytes) {
  if (typeof bytes === 'string') {
    const msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = new Uint8Array(msg.length);

    for (let i = 0; i < msg.length; ++i) {
      bytes[i] = msg.charCodeAt(i);
    }
  }

  return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
}
/*
 * Convert an array of little-endian words to an array of bytes
 */


function md5ToHexEncodedArray(input) {
  const output = [];
  const length32 = input.length * 32;
  const hexTab = '0123456789abcdef';

  for (let i = 0; i < length32; i += 8) {
    const x = input[i >> 5] >>> i % 32 & 0xff;
    const hex = parseInt(hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f), 16);
    output.push(hex);
  }

  return output;
}
/**
 * Calculate output length with padding and bit length
 */


function getOutputLength(inputLength8) {
  return (inputLength8 + 64 >>> 9 << 4) + 14 + 1;
}
/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */


function wordsToMd5(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << len % 32;
  x[getOutputLength(len) - 1] = len;
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;
    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  return [a, b, c, d];
}
/*
 * Convert an array bytes to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */


function bytesToWords(input) {
  if (input.length === 0) {
    return [];
  }

  const length8 = input.length * 8;
  const output = new Uint32Array(getOutputLength(length8));

  for (let i = 0; i < length8; i += 8) {
    output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
  }

  return output;
}
/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */


function safeAdd(x, y) {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return msw << 16 | lsw & 0xffff;
}
/*
 * Bitwise rotate a 32-bit number to the left.
 */


function bitRotateLeft(num, cnt) {
  return num << cnt | num >>> 32 - cnt;
}
/*
 * These functions implement the four basic operations the algorithm uses.
 */


function md5cmn(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5ff(a, b, c, d, x, s, t) {
  return md5cmn(b & c | ~b & d, a, b, x, s, t);
}

function md5gg(a, b, c, d, x, s, t) {
  return md5cmn(b & d | c & ~d, a, b, x, s, t);
}

function md5hh(a, b, c, d, x, s, t) {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5ii(a, b, c, d, x, s, t) {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

var _default = md5;
exports.default = _default;
},{}],115:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var _default = {
  randomUUID
};
exports.default = _default;
},{}],116:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = '00000000-0000-0000-0000-000000000000';
exports.default = _default;
},{}],117:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parse(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  let v;
  const arr = new Uint8Array(16); // Parse ########-....-....-....-............

  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 0xff;
  arr[2] = v >>> 8 & 0xff;
  arr[3] = v & 0xff; // Parse ........-####-....-....-............

  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 0xff; // Parse ........-....-####-....-............

  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 0xff; // Parse ........-....-....-####-............

  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 0xff; // Parse ........-....-....-....-############
  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
  arr[11] = v / 0x100000000 & 0xff;
  arr[12] = v >>> 24 & 0xff;
  arr[13] = v >>> 16 & 0xff;
  arr[14] = v >>> 8 & 0xff;
  arr[15] = v & 0xff;
  return arr;
}

var _default = parse;
exports.default = _default;
},{"./validate.js":127}],118:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
exports.default = _default;
},{}],119:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rng;
// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
let getRandomValues;
const rnds8 = new Uint8Array(16);

function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}
},{}],120:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

// Adapted from Chris Veness' SHA1 code at
// http://www.movable-type.co.uk/scripts/sha1.html
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;

    case 1:
      return x ^ y ^ z;

    case 2:
      return x & y ^ x & z ^ y & z;

    case 3:
      return x ^ y ^ z;
  }
}

function ROTL(x, n) {
  return x << n | x >>> 32 - n;
}

function sha1(bytes) {
  const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
  const H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  if (typeof bytes === 'string') {
    const msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = [];

    for (let i = 0; i < msg.length; ++i) {
      bytes.push(msg.charCodeAt(i));
    }
  } else if (!Array.isArray(bytes)) {
    // Convert Array-like to Array
    bytes = Array.prototype.slice.call(bytes);
  }

  bytes.push(0x80);
  const l = bytes.length / 4 + 2;
  const N = Math.ceil(l / 16);
  const M = new Array(N);

  for (let i = 0; i < N; ++i) {
    const arr = new Uint32Array(16);

    for (let j = 0; j < 16; ++j) {
      arr[j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    }

    M[i] = arr;
  }

  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;

  for (let i = 0; i < N; ++i) {
    const W = new Uint32Array(80);

    for (let t = 0; t < 16; ++t) {
      W[t] = M[i][t];
    }

    for (let t = 16; t < 80; ++t) {
      W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];

    for (let t = 0; t < 80; ++t) {
      const s = Math.floor(t / 20);
      const T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }

    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }

  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
}

var _default = sha1;
exports.default = _default;
},{}],121:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.unsafeStringify = unsafeStringify;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

function unsafeStringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}

function stringify(arr, offset = 0) {
  const uuid = unsafeStringify(arr, offset); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

var _default = stringify;
exports.default = _default;
},{"./validate.js":127}],122:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rng = _interopRequireDefault(require("./rng.js"));

var _stringify = require("./stringify.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html
let _nodeId;

let _clockseq; // Previous uuid creation time


let _lastMSecs = 0;
let _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

function v1(options, buf, offset) {
  let i = buf && offset || 0;
  const b = buf || new Array(16);
  options = options || {};
  let node = options.node || _nodeId;
  let clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189

  if (node == null || clockseq == null) {
    const seedBytes = options.random || (options.rng || _rng.default)();

    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }

    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


  let msecs = options.msecs !== undefined ? options.msecs : Date.now(); // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock

  let nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

  const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval


  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  } // Per 4.2.1.2 Throw error if too many uuids are requested


  if (nsecs >= 10000) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

  msecs += 12219292800000; // `time_low`

  const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff; // `time_mid`

  const tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff; // `time_high_and_version`

  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

  b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

  b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

  b[i++] = clockseq & 0xff; // `node`

  for (let n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf || (0, _stringify.unsafeStringify)(b);
}

var _default = v1;
exports.default = _default;
},{"./rng.js":119,"./stringify.js":121}],123:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _md = _interopRequireDefault(require("./md5.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v3 = (0, _v.default)('v3', 0x30, _md.default);
var _default = v3;
exports.default = _default;
},{"./md5.js":114,"./v35.js":124}],124:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.URL = exports.DNS = void 0;
exports.default = v35;

var _stringify = require("./stringify.js");

var _parse = _interopRequireDefault(require("./parse.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function stringToBytes(str) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape

  const bytes = [];

  for (let i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }

  return bytes;
}

const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
exports.DNS = DNS;
const URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
exports.URL = URL;

function v35(name, version, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    var _namespace;

    if (typeof value === 'string') {
      value = stringToBytes(value);
    }

    if (typeof namespace === 'string') {
      namespace = (0, _parse.default)(namespace);
    }

    if (((_namespace = namespace) === null || _namespace === void 0 ? void 0 : _namespace.length) !== 16) {
      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    } // Compute hash of namespace and value, Per 4.3
    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
    // hashfunc([...namespace, ... value])`


    let bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;

    if (buf) {
      offset = offset || 0;

      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }

      return buf;
    }

    return (0, _stringify.unsafeStringify)(bytes);
  } // Function#name is not settable on some platforms (#270)


  try {
    generateUUID.name = name; // eslint-disable-next-line no-empty
  } catch (err) {} // For CommonJS default export support


  generateUUID.DNS = DNS;
  generateUUID.URL = URL;
  return generateUUID;
}
},{"./parse.js":117,"./stringify.js":121}],125:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _native = _interopRequireDefault(require("./native.js"));

var _rng = _interopRequireDefault(require("./rng.js"));

var _stringify = require("./stringify.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function v4(options, buf, offset) {
  if (_native.default.randomUUID && !buf && !options) {
    return _native.default.randomUUID();
  }

  options = options || {};

  const rnds = options.random || (options.rng || _rng.default)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`


  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return (0, _stringify.unsafeStringify)(rnds);
}

var _default = v4;
exports.default = _default;
},{"./native.js":115,"./rng.js":119,"./stringify.js":121}],126:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _sha = _interopRequireDefault(require("./sha1.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v5 = (0, _v.default)('v5', 0x50, _sha.default);
var _default = v5;
exports.default = _default;
},{"./sha1.js":120,"./v35.js":124}],127:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regex = _interopRequireDefault(require("./regex.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validate(uuid) {
  return typeof uuid === 'string' && _regex.default.test(uuid);
}

var _default = validate;
exports.default = _default;
},{"./regex.js":118}],128:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function version(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  return parseInt(uuid.slice(14, 15), 16);
}

var _default = version;
exports.default = _default;
},{"./validate.js":127}]},{},[5]);
