const { ipcRenderer } = require('electron')

ipcRenderer.on('window-open-reply', (event, arg) => {
  console.log(arg)
})

document.getElementById("button-sp").onclick = () => {
  ipcRenderer.send('window-open', 'sp')
}
document.getElementById("button-vv").onclick = () => {
  ipcRenderer.send('window-open', 'vv')
}
document.getElementById("button-bp").onclick = () => {
  ipcRenderer.send('window-open', 'bp')
}
document.getElementById("button-mv").onclick = () => {
  ipcRenderer.send('window-open', 'mv')
}
document.getElementById("button-pw").onclick = () => {
  
}
document.getElementById("button-rs").onclick = () => {
  
}
