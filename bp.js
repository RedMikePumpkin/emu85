const {ipcRenderer} = require('electron')

[
  ["b-a7", 0x07],
  ["b-a8", 0x08],
  ["b-a9", 0x09],
  ["b-aa", 0x0a],
  ["b-c1", 0x10],
  ["b-a4", 0x04],
  ["b-a5", 0x05],
  ["b-a6", 0x06],
  ["b-ab", 0x0b],
  ["b-c2", 0x11],
  ["b-a1", 0x01],
  ["b-a2", 0x02],
  ["b-a3", 0x03],
  ["b-ac", 0x0c],
  ["b-c3", 0x12],
  ["b-a0", 0x00],
  ["b-af", 0x0f],
  ["b-ae", 0x0e],
  ["b-ad", 0x0d],
  ["b-c4", 0x13]
].forEach(i => {
  document.getElementById(i[0]).onclick = () => {
    ipcRenderer.send("io-interrupt", ['7.5', i[1]])
  }
})
