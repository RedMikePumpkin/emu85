const {ipcRenderer} = require('electron')
const moment = require('moment')
var text = new Array(80).fill(0x20).map(i => 16+Math.floor(Math.random() * 240))
var ddRamAddr = 0
var cgRamAddr = 0
var ramAddr = 0
var scroll = 0
var displayOn = 0
var cursorOffset = 1
var displayOffset = 0
var cursor = 1
var cursorBlink = 1
var busyFlag = 0
var useCanvas = 1;


// https://www.sparkfun.com/datasheets/LCD/HD44780.pdf page 24

function handleOut(port, data) {
  if (port === 0x38) {
      if (data & 0b10000000) { // set DDRAM addr
      busyFlag = 1
      // var tmp = ddRamAddr
      ddRamAddr = data & 0b01111111
      ramAddr = 0
      // renderChar(tmp)
      // renderChar(ddRamAddr)
      busyFlag = 0
    } else if (data & 0b01000000) { // set CGRAM addr
      busyFlag = 1
      // var tmp = cgRamAddr
      cgRamAddr = data & 0b00111111
      ramAddr = 1
      // renderChar(tmp+40)
      // renderChar(cgRamAddr+40)
      busyFlag = 0
    } else if (data & 0b00100000) { // function Set
      busyFlag = 1
      if (data & 0b00010000 === 0) {
        throw new Error("4-bit data not supported")
      }
      if (data & 0b00001000 === 0) {
        throw new Error("1-line mode not supported")
      }
      if (data & 0b00000100) {
        throw new Error("5x10 font not supported")
      }
      // renderText()
      busyFlag = 0
    } else if (data & 0b00010000) { // cursor or display shift
      busyFlag = 1
      if (ramAddr) {
        console.warn("trying to shift cursor/display in CGRAM")
        return
      }
      if (data & 0b00001000) { // display
        if (data & 0b00000100) {
          scroll++
          if (scroll > 39) scroll = 0
        } else {
          scroll--
          if (scroll < 0) scroll = 39
        }
        // renderText()
      } else { // cursor
        // var tmp = ddRamAddr
        if (data & 0b00000100) {
          ddRamAddr++
          if (ddRamAddr > 79) ddRamAddr = 0
        } else {
          ddRamAddr--
          if (ddRamAddr < 0) ddRamAddr = 79
        }
        // renderChar(tmp)
        // renderChar(ddRamAddr)
      }
      busyFlag = 0
    } else if (data & 0b00001000) { // display on/off control
      busyFlag = 1
      displayOn   = data & 0b00000100 ? 1 : 0
      cursor      = data & 0b00000010 ? 1 : 0
      cursorBlink = data & 0b00000001 ? 1 : 0
      // renderText()
      busyFlag = 0
    } else if (data & 0b00000100) { // entry mode set
      busyFlag = 1
      cursorOffset  = data & 0b00000010 ? 1 : -1
      displayOffset = data & 0b00000001 ? cursorOffset : 0
      busyFlag = 0
    } else if (data & 0b00000010) { // return home
      busyFlag = 1
      // var tmp = ddRamAddr
      ddRamAddr = 0
      // if (scroll !== 0) tmp = -1
      scroll = 0
      // if (tmp === -1) {
      //   renderText()
      // } else {
      //   renderChar(tmp)
      //   renderChar(0)
      // }
      busyFlag = 0
    } else if (data & 0b00000001) { // clear display
      busyFlag = 1
      text.fill(0x20)
      ddRamAddr = 0
      scroll = 0
      // renderText()
      busyFlag = 0
    } else {
      throw new Error("invalid command " + data)
    }
  }
  if (port === 0x39) {
    busyFlag = 1
    if (ramAddr) {
      font[cgRamAddr >>> 3][cgRamAddr % 8] = data
    } else {
      text[ddRamAddr] = data
    }
    if (ramAddr) {
      cgRamAddr += cursorOffset
      if (cgRamAddr > 79) cgRamAddr = 0
      if (cgRamAddr < 0) cgRamAddr = 79
    } else {
      ddRamAddr += cursorOffset
      if (ddRamAddr > 79) ddRamAddr = 0
      if (ddRamAddr < 0) ddRamAddr = 79
      scroll += displayOffset
      if (scroll > 39) scroll = 0
      if (scroll < 0) scroll = 39
    }
    // renderText()
    busyFlag = 0
  }
}

function handleIn(port) {
  if (port === 0x38) {
    var out = 0
    out |= busyFlag << 7
    if (ramAddr) {
      out |= cgRamAddr
      out |= 0b01000000
    } else {
      out |= ddRamAddr
    }
    ipcRenderer.send("io-in-reply", out)
  }
  if (port === 0x39) {
    busyFlag = 1
    if (ramAddr) {
      ipcRenderer.send("io-in-reply", font[cgRamAddr >>> 3][cgRamAddr % 8])
    } else {
      ipcRenderer.send("io-in-reply", text[ddRamAddr])
    }
    if (ramAddr) {
      cgRamAddr += cursorOffset
      if (cgRamAddr > 79) cgRamAddr = 0
      if (cgRamAddr < 0) cgRamAddr = 79
    } else {
      ddRamAddr += cursorOffset
      if (ddRamAddr > 79) ddRamAddr = 0
      if (ddRamAddr < 0) ddRamAddr = 79
      scroll += displayOffset
      if (scroll > 39) scroll = 0
      if (scroll < 0) scroll = 39
    }
    busyFlag = 0
  }
}

ipcRenderer.on('io-out', (event, arg) => {
  handleOut(...arg)
})

ipcRenderer.on('io-in', (event, arg) => {
  handleIn(...arg)
})


var vvt = document.getElementById("vv-table")
var vvc = document.getElementById("vv-canvas")
var ctx = vvc.getContext("2d")
var vx = 0, vy = 0
var pixelsPerPixel = 0
var cColors = {
  bg: "#1D1413",
  off: "#333132",
  on: "#EDEBED",
  glow: "#C1E9E9"
}

window.onresize = () => {
  var windowWidth = window.innerWidth
  var windowHeight = window.innerHeight
  var aspectWidth = 168
  var aspectHeight = 19//useCanvas ? 21 : 19
  // var screenWidth = Math.floor(windowWidth / aspectWidth / 2 - 1) * 2
  // var screenHeight = Math.floor(windowHeight / aspectHeight / 2 - 1) * 2
  var screenWidth = windowWidth / aspectWidth
  var screenHeight = windowHeight / aspectHeight
  var pixelSize = Math.min(screenWidth, screenHeight)
  // Array.from(document.getElementsByClassName("vv-pixel")).forEach(i => {
  //   i.style.fontSize = `${pixelSize}px`
  // })
  if (useCanvas) {
    if (screenWidth > screenHeight) {
      vvc.style.height = `${windowHeight}px`
      vvc.style.width = `auto`
      vvc.height = windowHeight
      vvc.width = windowHeight * aspectWidth / aspectHeight
    } else {
      vvc.style.height = `auto`
      vvc.style.width = `${windowWidth}px`
      vvc.height = windowWidth * aspectHeight / aspectWidth
      vvc.width = windowWidth
    }
    pixelsPerPixel = pixelSize
    // renderText()
  } else {
    vvt.style.setProperty("--vv-ps", `${Math.floor(pixelSize-1)}px`)
    if (pixelSize < 4.5) {
      vvt.classList.remove("vv-hd")
      vvt.classList.remove("vv-md")
    } else if (pixelSize < 5.5) {
      vvt.classList.remove("vv-hd")
      vvt.classList.add("vv-md")
    } else {
      vvt.classList.add("vv-hd")
      vvt.classList.add("vv-md")
    }
  }
}

(async () => {
  if (useCanvas) {
    //vvt.style.display = "none"
  } else {
    for (var y = 0; y < 19; ++y) {
      var row = document.createElement("tr")
      vvt.appendChild(row)
      vx = 0
      for (var x = 0; x < 168; ++x) {
        var isFrame = false
        if (x % 7 === 0 || x % 7 === 6) isFrame = true
        if (y % 9 === 0) isFrame = true
        var col = document.createElement("td")
        row.appendChild(col)
        if (!isFrame) col.id = `${vx}-${vy}`
        col.classList.add("vv-pixel")
        //console.log(vx,vy)
        if (!isFrame) ++vx
        if (y % 9 === 8 && !isFrame) {
          col.colSpan = 5;
          x += 4
          vx += 4
        }
      }
      //if (y % 10 === 0)await new Promise(y => setTimeout(y, 0))
      if (y % 9 !== 0) ++vy
    }
  }
  window.onresize()
  // renderText()
  
  handleOut(0x38, 0x38)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x38, 0x0e)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x38, 0x01)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x38, 0x06)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x48)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x65)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x6c)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x6c)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x6f)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x2c)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x20)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x57)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x6f)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x72)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x6c)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x64)
  await new Promise(y=>setTimeout(y,100))
  handleOut(0x39, 0x21)
})()

function renderText() {
  ctx.fillStyle = cColors.bg
  ctx.fillRect(0,0,vvc.width,vvc.height)
  for (var x = 0; x < 80; ++x) {
    renderChar(x)
  }
}

function renderChar(addr) {
  var x = (addr+scroll) % 40
  var y = (addr - (addr % 40)) / 40
  // if (useCanvas) {
  //   ctx.fillStyle = cColors.bg
  //   ctx.fillRect(
  //     (x * 7 + 1) * pixelsPerPixel,
  //     (y * 9 + 1) * pixelsPerPixel,
  //     (5) * pixelsPerPixel,
  //     (8.25) * pixelsPerPixel
  //   )
  // }
  var tAddr = ramAddr ? cgRamAddr + 40 : ddRamAddr;
  // var rnd = Math.random()
  for (var cy = 0; cy < 8; ++cy) {
    for (var cx = 0; cx < 5; ++cx) {
      var isCursor = false
      if (tAddr === addr) {
        if (cy === 7 && cursor) isCursor = true
        if (cursorBlink && moment().second() % 2 === 0) isCursor = true
        // if (rnd > 0.5) isCursor = true
      }
      var on = displayOn && (isCursor || ((font[text[addr]][cy] >>> (4 - cx)) & 1))
      if (useCanvas) {
        ctx.fillStyle = on ? cColors.on : cColors.off
        ctx.fillRect(
          (x * 7 + 1.125 + cx) * pixelsPerPixel,
          (y * 9 + (cy === 7 ? 1.375 : 1.125) + cy) * pixelsPerPixel,
          (cy === 7 ? 4.75 : 0.75) * pixelsPerPixel,
          (0.75) * pixelsPerPixel)
      } else {
        var elem = document.getElementById(`${x*5+cx}-${y*8+cy}`)
        if (elem) {
          if (on) {
            elem.classList.remove("vv-off")
            elem.classList.add("vv-on")
          } else {
            elem.classList.remove("vv-on")
            elem.classList.add("vv-off")
          }
        }
      }
      if (cy >= 7) break
    }
  }
}

function frame() {
  renderText()
  // renderChar(ramAddr ? cgRamAddr + 40 : ddRamAddr)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
