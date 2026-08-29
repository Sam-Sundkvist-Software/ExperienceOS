import { ADR } from "./adr";

/* XP Applications (ES6) - FCCF Proxy */
export const XP_Apps = (() => {
    return {
        notepad: (filePath: string) => ADR.load('notepad', { filePath }),
        explorer: (initialPath: string) => ADR.load('explorer', { initialPath }),
        cmd: () => ADR.load('cmd'),
        control: () => ADR.load('control'),
        regedit: () => ADR.load('regedit'),
        calc: () => ADR.load('calc'),
        paint: () => ADR.load('paint'),
        minesweeper: () => ADR.load('minesweeper'),
        antivirus: () => ADR.load('antivirus'),
        userAccounts: () => ADR.load('userAccounts'),
        displayProperties: () => ADR.load('displayProperties')
    };
})();
