import { dialog, ipcMain, app, BrowserWindow, screen } from "electron";
import { store } from "./setIpcStore";
import { mergePdf, setMainWinProgressBar } from "../utils";
import wins from "../wins";
import path from "path";
import { WIN_WIDTH, WIN_HEIGHT, BACKGROUND_COLOR } from "../const";
import fs from "fs";
import { ROOT_PATH, preload } from "../wins/createMainwin";
import { menu } from "../main/menu";

export function setIpcs() {
  // 打开选择文件夹
  ipcMain.handle("open-directory-dialog", async (e: any, setting: any) => {
    const defaultSetting = { properties: ["openDirectory"] };
    const opt = Object.assign({}, defaultSetting, setting);
    const res = await dialog.showOpenDialog(opt);
    return res;
  });

  // 合并pdf文件
  ipcMain.handle("merge-pdf", async (e: any, setting: any) => {
    setMainWinProgressBar(0.3);
    const fileName = setting.fileName;
    const fileList = await (<StoredFileListItem[]>store.get("file-list"));
    const savedDir = await (<string>store.get("saved-dir"));
    const savedPath = path.join(savedDir, fileName);
    if (fs.existsSync(savedPath)) {
      const btnIdx = dialog.showMessageBoxSync({
        type: "warning",
        buttons: ["是", "取消"],
        message: `${fileName}已存在，是否覆盖？`,
      });
      if (btnIdx === 1) {
        return {
          status: "cancel",
        };
      }
    }
    try {
      await mergePdf(savedDir, savedPath);
      setMainWinProgressBar(-1);
      return {
        status: "success",
        savedPath,
      };
    } catch (err: any) {
      setMainWinProgressBar(-1);
      return {
        status: "error",
        savedPath,
        msg: err.message,
      };
    }
  });

  // blue win
  ipcMain.on("mainwin-size", async (e: any, setting: any) => {
    if (!wins.mainwin || !setting) return;
    if (setting.action === "hide") wins.mainwin.hide();
    else if (setting.action === "show") wins.mainwin.show();
    else if (setting.action === "maximize") wins.mainwin.maximize();
    else if (setting.action === "unmaximize") wins.mainwin.unmaximize();
    else if (setting.action === "minimize") wins.mainwin.minimize();
    else if (setting.action === "restore") wins.mainwin.restore();
    else if (setting.action === "close") wins.mainwin.close();
    else if (setting.action === "blur") wins.mainwin.blur();
    else if (setting.action === "focus") wins.mainwin.focus();
  });

  ipcMain.on("mainwin-isMaximized", async (e: any, setting: any) => {
    if (!wins.mainwin) {
      e.returnValue = false;
    } else {
      e.returnValue = wins.mainwin.isMaximized();
    }
  });

  ipcMain.on("mainwin-move", async (e: any, setting: any) => {
    // wins.mainwin && wins.mainwin.setPosition(setting.x, setting.y)
    const bounds = {
      x: setting.x,
      y: setting.y,
      width: WIN_WIDTH,
      height: WIN_HEIGHT,
    };
    wins.mainwin && wins.mainwin.setBounds(bounds);
  });

  ipcMain.on("get-appinfo", async (e: any, setting: any) => {
    const data = {
      version: app.getVersion(),
      name: app.getName(),
    };
    e.returnValue = data;
  });

  ipcMain.handle("createOtherWindow", (e, data) => {
    const allWindows = BrowserWindow.getAllWindows();
    var vipWin = new BrowserWindow({
      width: screen.getPrimaryDisplay().workAreaSize.width,
      height: screen.getPrimaryDisplay().workAreaSize.height,
      minWidth: screen.getPrimaryDisplay().workAreaSize.width,
      minHeight: screen.getPrimaryDisplay().workAreaSize.height,
      title: "靖靖，生日快乐",
      icon: path.join(ROOT_PATH.public, "favicon.ico"),
      backgroundColor: BACKGROUND_COLOR,
      // frame: false,
      // closable: true,
      parent: allWindows[0], // win是主窗口
      titleBarOverlay: {
        color: BACKGROUND_COLOR,
        symbolColor: "#fff",
      },
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });
    vipWin.loadURL("https://www.wangkangbao.top/happybirthday");
    vipWin.menuBarVisible = false;
    vipWin.setTitle("靖靖，生日快乐");
    vipWin.on("closed", () => {
      vipWin.destroy();
    });
  });
}
