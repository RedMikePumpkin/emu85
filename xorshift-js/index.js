var kMantissaMask = (1n << 52n) - 1n

function seedFromUint32(seed, buffer) {
  if (seed === undefined || buffer === undefined) {
    throw new Error("seedFromUint32 takes 2 arguments")
  }
  if (seed % 1 !== 0 || seed < 0 || seed >= 4294967296) {
    throw new Error("seed must be Uint32")
  }
  if (buffer.constructor !== ArrayBuffer) {
    throw new Error("buffer must be ArrayBuffer")
  }

  // theres some stuff if there is 3 args but there is never 3 args and im lazy

  if (buffer.byteLength < 16) {
    throw new Error("buffer not big enough")
  }

  var view = new Uint32Array(buffer)



  view[0] = Number(((BigInt(seed   ) * 48271n) % 2147483647n))
  view[1] = Number(((BigInt(view[0]) * 48271n) % 2147483647n))
  view[2] = Number(((BigInt(view[1]) * 48271n) % 2147483647n))
  view[3] = Number(((BigInt(view[2]) * 48271n) % 2147483647n))
}

class XORShift {
  constructor(buffer, offset) {
    if (buffer === undefined) {
      throw new Error("buffer must be ArrayBuffer")
    }
    if (buffer.constructor !== ArrayBuffer) {
      throw new Error("buffer must be ArrayBuffer")
    }

    // once again more stuff but this time it can happen

    if (offset === undefined) offset = 0

    if (buffer.byteLength < offset + 16) {
      throw new Error("buffer not big enough")
    }

    this.state = new BigUint64Array(buffer, offset)

  }
  next() {
    var state = this.state

    var x = state[0]
    var y = state[1]
    state[0] = y
    x ^= x << 23n
    x ^= x >>> 17n
    x ^= y
    x ^= y >>> 26n
    state[1] = x

    var mantissa = (state[0] + state[1]) & kMantissaMask
    return mantissa * (2n ** -52n)

  }
  static fromRandom() {
    var buffer = new ArrayBuffer(32)
    var view = new Uint32Array(buffer)
    view.forEach(i => Math.floor(Math.random() * 4294967296))
    return (Math.max(...view) > 0) ? new XORShift(buffer) : XORShift.fromRandom()
  }
  static fromHex(seed) {
    if (typeof seed !== 'string') throw new TypeError('seed must be a string')
    if (seed.length !== 32) throw new TypeError('seed must be 32 characters long')
    var buffer = new ArrayBuffer(32)
    var view = new Buffer.from(buffer)
    view.write(seed, 'hex')
    return new XORShift(buffer)
  }
  static fromUint32(seed) {
    var buffer = new ArrayBuffer(32)
  }
}

module.exports.seedFromUint32 = seedFromUint32;
