const electron = require("electron")

function createWindow() {
  createGeneralWindow("main", true)
}

const menus = [
  electron.Menu.buildFromTemplate([
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
      ]
    }
  ])
]

var windows = []

var windowids = {
  main: {
    width: 250,
    height: 300,
    path: "index.html",
    menu: 0,
    rs: true,
    frame: true,
    title: "EMU-8085"
  },
  sp: {
    width: 820,
    height: 420,
    path: "sp.html",
    menu: 0,
    rs: true,
    frame: true,
    title: "EMU-8085"
  },
  vv: {
    width: 1008,
    height: 114,
    minWidth: 672,
    minHeight: 96,
    path: "vv.html",
    menu: 0,
    rs: true,
    frame: true,
    title: "VFD Screen"
  },
  bp: {
    width: 500,
    height: 400,
    path: "bp.html",
    menu: 0,
    rs: true,
    frame: true,
    title: "EMU-8085"
  },
  mv: {
    width: 250,
    height: 300,
    path: "mv.html",
    menu: 0,
    rs: true,
    frame: true,
    title: "EMU-8085"
  }
}

function createGeneralWindow(id, main) {
  var set = windowids[id]
  // create window
  var win = new electron.BrowserWindow({
    width: set.width,
    height: set.height,
    minWidth: set.minWidth || set.width,
    minHeight: set.minHeight || set.height,
    useContentSize: true,
    frame: set.frame,
    title: set.title,
    resizable: set.rs,
    webPreferences: {
      nodeIntegration: true
    },
    backgroundColor: "#ffffff"
  })

  win.once('ready-to-show', () => {
    win.show()
  })

  //if (!set.rs) win.setAspectRatio(725/115)

  // load index.html
  win.loadFile(set.path)
  console.log(set.path)

  win.setMenu(set.menu === -1 ? null : menus[set.menu])
  //win.webContents.openDevTools()

  if (main) {
    win.on("close", (event) => {
      windows.forEach(i => {
        if (!i.isDestroyed()) i.close();
      })
    });
  } else {
    windows.push(win);
  }
}

electron.app.whenReady().then(createWindow)

electron.Menu.setApplicationMenu(menus[0])

electron.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electron.app.quit()
  }
})

electron.app.on('activate', () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

electron.ipcMain.on('window-open', (event, arg) => {
  createGeneralWindow(arg, false)
  event.reply('window-open-reply', 'pong')
})
