var memory = new ArrayBuffer(65536)
var register = new ArrayBuffer(12)
/* 
 *         +-----+-----+
 * 0x0 0x0 | PSU | A   | 0x1
 *         +-----+-----+
 * 0x1 0x2 | C   | B   | 0x3
 *         +-----+-----+
 * 0x2 0x4 | E   | D   | 0x5
 *         +-----+-----+
 * 0x3 0x6 | L   | H   | 0x7
 *         +-----+-----+
 *     
 *         +-----------+
 * 0x4 0x8 | SP        | 0x9
 *         +-----------+
 * 0x5 0xA | PC        | 0xB
 *         +-----------+
 * 
 */
var m_8 = new Uint8Array(memory)
var r_8 = new Uint8Array(register)
var r_16 = new Uint16Array(register)
var halt = false

function IsLittleEndian() {
  var ab = new ArrayBuffer(2)
  var a8 = new Uint8Array(ab)
  var a16 = new Uint16Array(ab)
  a8[0] = 0x34
  a8[1] = 0x12
  return a16 === 0x1234
}

var regMap = IsLittleEndian() ? 
  [3, 2, 5, 4, 7, 6,-1, 1, 0, 8, 9, 10,11] :
  [2, 3, 4, 5, 6, 7,-1, 0, 1, 9, 8, 11,10]
// 0  1  2  3  4  5  6  7  8  9  10 11 12
// B  C  D  E  H  L  M  A  F  S  P  P  C
//*/

; // needed semicolon lol

(i => {
  m_8[i++] = 0x3e // MVI A,05h
  m_8[i++] = 0x05
  m_8[i++] = 0x06 // MVI B,24h
  m_8[i++] = 0xff
  m_8[i++] = 0x80 // ADD B
  m_8[i++] = 0xff // RST 7
})(0)
//*/

function runInstruction() {

  var inst = m_8[r_16[5]++]
  if (inst & 0b10000000) {
    if (inst & 0b01000000) { // bottom
    
    } else { // math
      if (inst & 0b00100000) {
        if (inst & 0b00010000) {
          if (inst & 0b00001000) { // cmp
            var reg = regMap[inst & 0b00000111]
            var val = 0, flag = 0
            if (reg === -1) {
              val = m_8[r_16[5]]
            } else {
              val = r_8[reg]
            }
            var pv = r_8[regMap[7]]
            var nv = r_8[regMap[7]] - val
            if (pv - val < 0)
              flag |= 0b00000001 // Carry
            if (!nv)
              flag |= 0b01000000 // Zero
            if (nv & 0b10000000)
              flag |= 0b10000000 // Sign
            if (nv & 1)
              flag |= 0b00000100 // Parity
            if (pv & 0xf0 < nv & 0xf0)
              flag |= 0b00010000 // Aux Carry
            if ((flag & 0b00000001) ^ !((0x80 - ((pv & 0x7F) - (nv & 0x7F)) & 0x80) >>> 7))
              flag |= 0b00000010 // V
            if ((flag & 0b00000001) ^ (flag & 0b10000000))
              flag |= 0b00100000 // K
            r_8[regMap[8]] = flag
          } else { // ora
            var reg = regMap[inst & 0b00000111]
            var val = 0, flag = 0
            if (reg === -1) {
              val = m_8[r_16[5]]
            } else {
              val = r_8[reg]
            }
            var pv = r_8[regMap[7]]
            var nv = (r_8[regMap[7]] |= val)
            // if (pv + val > 255)
            //   flag |= 0b00000001 // Carry
            if (!nv)
              flag |= 0b01000000 // Zero
            if (nv & 0b10000000)
              flag |= 0b10000000 // Sign
            if (nv & 1)
              flag |= 0b00000100 // Parity
            // if (pv & 0xf0 < nv & 0xf0)
            //   flag |= 0b00010000 // Aux Carry
            // if ((flag & 0b00000001) ^ ((((pv & 0x7F) + (nv & 0x7F)) & 0x80) >>> 7))
            //   flag |= 0b00000010 // V
            if (flag & 0b10000000)
              flag |= 0b00100000 // K
            r_8[regMap[8]] = flag
          }
        } else {
          if (inst & 0b00001000) { // xra
            var reg = regMap[inst & 0b00000111]
            var val = 0, flag = 0
            if (reg === -1) {
              val = m_8[r_16[5]]
            } else {
              val = r_8[reg]
            }
            var pv = r_8[regMap[7]]
            var nv = (r_8[regMap[7]] ^= val)
            // if (pv + val > 255)
            //   flag |= 0b00000001 // Carry
            if (!nv)
              flag |= 0b01000000 // Zero
            if (nv & 0b10000000)
              flag |= 0b10000000 // Sign
            if (nv & 1)
              flag |= 0b00000100 // Parity
            // if (pv & 0xf0 < nv & 0xf0)
            //   flag |= 0b00010000 // Aux Carry
            // if ((flag & 0b00000001) ^ ((((pv & 0x7F) + (nv & 0x7F)) & 0x80) >>> 7))
            //   flag |= 0b00000010 // V
            if (flag & 0b10000000)
              flag |= 0b00100000 // K
            r_8[regMap[8]] = flag
          } else { // ana
            var reg = regMap[inst & 0b00000111]
            var val = 0, flag = 0
            if (reg === -1) {
              val = m_8[r_16[5]]
            } else {
              val = r_8[reg]
            }
            var pv = r_8[regMap[7]]
            var nv = (r_8[regMap[7]] &= val)
            // if (pv + val > 255)
            //   flag |= 0b00000001 // Carry
            if (!nv)
              flag |= 0b01000000 // Zero
            if (nv & 0b10000000)
              flag |= 0b10000000 // Sign
            if (nv & 1)
              flag |= 0b00000100 // Parity
            // if (pv & 0xf0 < nv & 0xf0)
            //   flag |= 0b00010000 // Aux Carry
            // if ((flag & 0b00000001) ^ ((((pv & 0x7F) + (nv & 0x7F)) & 0x80) >>> 7))
            //   flag |= 0b00000010 // V
            if (flag & 0b10000000)
              flag |= 0b00100000 // K
            r_8[regMap[8]] = flag
          }
        }
      } else {
        if (inst & 0b00010000) {
          if (inst & 0b00001000) { // sbb
            var reg = regMap[inst & 0b00000111]
            var val = 0, flag = 0
            if (reg === -1) {
              val = m_8[r_16[5]]
            } else {
              val = r_8[reg]
            }
            var pv = r_8[regMap[7]]
            var nv = (r_8[regMap[7]] -= val + (flag & 0b00000001));
            if (pv - val - (flag & 0b00000001) > 255)
              flag |= 0b00000001 // Carry
            if (!nv)
              flag |= 0b01000000 // Zero
            if (nv & 0b10000000)
              flag |= 0b10000000 // Sign
            if (nv & 1)
              flag |= 0b00000100 // Parity
            if (pv & 0xf0 < nv & 0xf0)
              flag |= 0b00010000 // Aux Carry
            if ((flag & 0b00000001) ^ !((0x80 - ((pv & 0x7F) - (nv & 0x7F)) & 0x80) >>> 7))
              flag |= 0b00000010 // V
            if ((flag & 0b00000001) ^ (flag & 0b10000000))
              flag |= 0b00100000 // K
            r_8[regMap[8]] = flag
          } else { // sub
            var reg = regMap[inst & 0b00000111]
            var val = 0, flag = 0
            if (reg === -1) {
              val = m_8[r_16[5]]
            } else {
              val = r_8[reg]
            }
            var pv = r_8[regMap[7]]
            var nv = (r_8[regMap[7]] -= val)
            if (pv - val < 0)
              flag |= 0b00000001 // Carry
            if (!nv)
              flag |= 0b01000000 // Zero
            if (nv & 0b10000000)
              flag |= 0b10000000 // Sign
            if (nv & 1)
              flag |= 0b00000100 // Parity
            if (pv & 0xf0 < nv & 0xf0)
              flag |= 0b00010000 // Aux Carry
            if ((flag & 0b00000001) ^ !((0x80 - ((pv & 0x7F) - (nv & 0x7F)) & 0x80) >>> 7))
              flag |= 0b00000010 // V
            if ((flag & 0b00000001) ^ (flag & 0b10000000))
              flag |= 0b00100000 // K
            r_8[regMap[8]] = flag
          }
        } else {
          if (inst & 0b00001000) { // adc
            var reg = regMap[inst & 0b00000111]
            var val = 0, flag = 0
            if (reg === -1) {
              val = m_8[r_16[5]]
            } else {
              val = r_8[reg]
            }
            var pv = r_8[regMap[7]]
            var nv = (r_8[regMap[7]] += (flag & 0b00000001) + val);
            if (pv + (flag & 0b00000001) + val > 255)
              flag |= 0b00000001 // Carry
            if (!nv)
              flag |= 0b01000000 // Zero
            if (nv & 0b10000000)
              flag |= 0b10000000 // Sign
            if (nv & 1)
              flag |= 0b00000100 // Parity
            if (pv & 0xf0 < nv & 0xf0)
              flag |= 0b00010000 // Aux Carry
            if ((flag & 0b00000001) ^ ((((pv & 0x7F) + (nv & 0x7F)) & 0x80) >>> 7))
              flag |= 0b00000010 // V
            if ((flag & 0b00000001) ^ (flag & 0b10000000))
              flag |= 0b00100000 // K
          } else { // add
            var reg = regMap[inst & 0b00000111]
            var val = 0, flag = 0
            if (reg === -1) {
              val = m_8[r_16[5]]
            } else {
              val = r_8[reg]
            }
            var pv = r_8[regMap[7]]
            var nv = (r_8[regMap[7]] += val)
            if (pv + val > 255)
              flag |= 0b00000001 // Carry
            if (!nv)
              flag |= 0b01000000 // Zero
            if (nv & 0b10000000)
              flag |= 0b10000000 // Sign
            if (nv & 1)
              flag |= 0b00000100 // Parity
            if (pv & 0xf0 < nv & 0xf0)
              flag |= 0b00010000 // Aux Carry
            if ((flag & 0b00000001) ^ ((((pv & 0x7F) + (nv & 0x7F)) & 0x80) >>> 7))
              flag |= 0b00000010 // V
            if ((flag & 0b00000001) ^ (flag & 0b10000000))
              flag |= 0b00100000 // K
            r_8[regMap[8]] = flag
          }
        }
      }
    }
  } else {
    if (inst & 0b01000000) { // move
      if (inst === 0b01110110) { // hlt
        halt = true
      } else { // mov
        var dest = regMap[(inst & 0b00111000) >>> 3]
        var source = regMap[inst & 0b00000111]
        if (dest === -1) {
          if (source === -1) {
            throw new Error('what the actual fuck')
          } else {
            m_8[r_16[5]] = r_8[source]
          }
        } else {
          if (source === -1) {
            r_8[dest] = r_8[source]
          } else {
            r_8[dest] = r_8[source]
          }
        }
      }
    } else { // top
      if (inst & 0b00000100) {
        if (inst & 0b00000010) {
          if (inst & 0b00000001) { // 8x rlc, rrc, etc.
    
          } else { // mvi
            var dest = (inst & 0b00111000) >>> 3
            r_8[regMap[dest]] = m_8[r_16[5]++]
          }
        } else {
          if (inst & 0b00000001) { // dcr
            var reg = regMap[inst & 0b00111000]
            var val = 0, flag = 0
            if (reg === -1) {
              val = m_8[r_16[5]]
            } else {
              val = r_8[reg]
            }
            flag = 0
            var pv = val
            var nv = (val -= 1)
            // if (pv - 1 < 0)
            //   flag |= 0b00000001 // Carry
            if (!nv)
              flag |= 0b01000000 // Zero
            if (nv & 0b10000000)
              flag |= 0b10000000 // Sign
            if (nv & 1)
              flag |= 0b00000100 // Parity
            if (pv & 0xf0 < nv & 0xf0)
              flag |= 0b00010000 // Aux Carry
            if ((flag & 0b00000001) ^ !((0x80 - ((pv & 0x7F) - (nv & 0x7F)) & 0x80) >>> 7))
              flag |= 0b00000010 // V
            if (reg === -1) {
              m_8[r_16[5]] = val
            } else {
              r_8[reg] = val
            }
            r_8[regMap[8]] = flag | (r_8[regMap[8]] & 0x01)
          } else { // inr
            var reg = regMap[inst & 0b00111000]
            var val = 0, flag = 0
            if (reg === -1) {
              val = m_8[r_16[5]]
            } else {
              val = r_8[reg]
            }
            flag = 0
            var pv = val
            var nv = (val += 1)
            if (pv + 1 > 255)
              flag |= 0b00000001 // Carry
            if (!nv)
              flag |= 0b01000000 // Zero
            if (nv & 0b10000000)
              flag |= 0b10000000 // Sign
            if (nv & 1)
              flag |= 0b00000100 // Parity
            if (pv & 0xf0 < nv & 0xf0)
              flag |= 0b00010000 // Aux Carry
            if ((flag & 0b00000001) ^ !((0x80 - ((pv & 0x7F) - (nv & 0x7F)) & 0x80) >>> 7))
              flag |= 0b00000010 // V
            if (reg === -1) {
              m_8[r_16[5]] = val
            } else {
              r_8[reg] = val
            }
            r_8[regMap[8]] = flag | (r_8[regMap[8]] & 0x01)
          }
        }
      } else {
        if (inst & 0b00000010) {
          if (inst & 0b00000001) {
            if (inst & 0b00001000) { // dcx
      
            } else { // inx
      
            }
          } else { // 6x stax, ldax, etc.
    
          }
        } else {
          if (inst & 0b00000001) {
            if (inst & 0b00001000) { // dad
      
            } else { // lxi
      
            }
          } else { // 8x nop, dsub, etc.
    
          }
        }
      }
    }
  }
  registers()
}

module.exports = {
  runInstruction: runInstruction,
  m_8: m_8,
  r_8: r_8,
  r_16: r_16,
  registers: registers
}

function format(h, n) {
  if (h === 'h') {
    return ('00'+n.toString(16)).slice(-2)
  } else if (h === 'b') {
    return ('00000000'+n.toString(2)).slice(-8)
  } else {

  }
}
function registers() {
  console.log(`A: 0x${format('h', r_8[regMap[7]])}, F: 0b${format('b', r_8[regMap[8]])}`)
  console.log(`B: 0x${format('h', r_8[regMap[0]])}, C: 0x${format('h', r_8[regMap[1]])}`)
  console.log(`D: 0x${format('h', r_8[regMap[2]])}, E: 0x${format('h', r_8[regMap[3]])}`)
  console.log(`H: 0x${format('h', r_8[regMap[4]])}, L: 0x${format('h', r_8[regMap[5]])}`)
  console.log(`S: 0x${format('h', r_8[regMap[9]])}, P: 0x${format('h', r_8[regMap[10]])}`)
  console.log(`P: 0x${format('h', r_8[regMap[11]])}, C: 0x${format('h', r_8[regMap[12]])}`)
}
