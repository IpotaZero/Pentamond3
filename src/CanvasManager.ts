import { BlockKind, BlockProperty } from "./BlockOperate/Block";
import { MondState } from "./BlockOperate/Monoiamond";
import { Pentiamond } from "./BlockOperate/Pentiamond";
import * as Setting from "./Settings";
import { arrayPlus } from "./Utils";

export type GraphicData = {
    blockProperties: BlockProperty[][] | null;
    ghostMondState: MondState[];
    next: BlockKind[];
    hold: BlockKind | null;
};

export class CanvasManager {
    private playCanvas: HTMLCanvasElement = document.createElement("canvas");
    private pct: CanvasRenderingContext2D;
    private nextCanvas: HTMLCanvasElement = document.createElement("canvas");
    private nct: CanvasRenderingContext2D;
    private data: GraphicData = {
        blockProperties: null,
        ghostMondState: [],
        next: [],
        hold: null,
    };
    guideBorder: boolean = false;
    guideBorderHeight: number = 15;
    constructor() {
        this.playCanvas.classList.add("playCanvas");
        this.pct = this.playCanvas.getContext("2d")!;
        this.playCanvas.height = Setting.blockHeight * (Setting.height + Setting.displayMargin);
        this.playCanvas.width = Setting.blockWidth * Setting.width;
        this.playCanvas.style.aspectRatio = this.playCanvas.width / this.playCanvas.height + "";
        this.nextCanvas.classList.add("nextCanvas");
        this.nct = this.nextCanvas.getContext("2d")!;
        this.nextCanvas.height = Setting.blockHeight * Setting.next.height * (Setting.next.scale.hold + Setting.next.scale.normal * Setting.next.length) + Setting.next.gap;
        this.nextCanvas.width = Setting.blockWidth * Setting.next.width * Math.max(Setting.next.scale.hold, Setting.next.scale.normal);
        this.nextCanvas.style.aspectRatio = this.nextCanvas.width / this.nextCanvas.height + "";
    }

    get g$playCanvas() {
        return this.playCanvas;
    }

    get g$nextCanvas() {
        return this.nextCanvas;
    }

    readData(data: GraphicData) {
        this.data = data;
    }

    paint() {
        this.paintPlayCanvas();
        this.paintNextCanvas();
    }

    paintPlayCanvas() {
        this.pct.clearRect(0, 0, this.playCanvas.width, this.playCanvas.height);
        this.paintBackground();
        if (this.guideBorder) {
            this.paintGuideBorder();
        }
        this.paintGrid();
        this.paintGhost();
        this.paintBlocks();
    }

    private paintGhost() {
        if (this.data.ghostMondState.length == 0) {
            return;
        }
        this.data.ghostMondState.forEach((state) => {
            this.paintBlock(state[0], state[1], [state[2], state[3], true], true);
        });
    }

    private paintBlocks() {
        if (!this.data.blockProperties) {
            return;
        }
        for (let x = 0; x < Setting.playWidth; x++) {
            for (let y = 0; y < Setting.playHeight; y++) {
                this.paintBlock(x, y, this.data.blockProperties[x][y]);
            }
        }
    }

    private paintBlock(x: number, y: number, property: BlockProperty, isGhost = false) {
        if (!property[2]) {
            return;
        }

        if (isGhost) {
            this.pct.strokeStyle = Setting.mondGrid.ghost.color;
            this.pct.fillStyle = Setting.blockColor.ghost[property[0]];
            this.pct.lineWidth = Setting.mondGrid.ghost.width;
        } else {
            this.pct.strokeStyle = Setting.mondGrid.normal.color;
            this.pct.fillStyle = Setting.blockColor.normal[property[0]];
            this.pct.lineWidth = Setting.mondGrid.normal.width;
        }
        this.pct.lineJoin = "bevel";
        this.pct.lineCap = "round";
        const position = this.getGraphicPosition(x, y);
        const p1 = arrayPlus([0, property[1] ? Setting.blockHeight : 0], position);
        const p2 = arrayPlus([Setting.blockWidth / 2, property[1] ? 0 : Setting.blockHeight], position);
        const p3 = arrayPlus([Setting.blockWidth, property[1] ? Setting.blockHeight : 0], position);
        this.pct.beginPath();
        this.pct.moveTo(p1[0], p1[1]);
        this.pct.lineTo(p2[0], p2[1]);
        this.pct.lineTo(p3[0], p3[1]);
        this.pct.closePath();
        this.pct.fill();
        this.pct.stroke();
    }

    private paintBackground() {
        this.pct.fillStyle = Setting.backgroundColor;
        this.pct.fillRect(0, 0, this.playCanvas.width, this.playCanvas.height);
    }

    private paintGuideBorder() {
        this.pct.fillStyle = Setting.guideBorderColor;
        this.pct.fillRect(0, Setting.blockHeight * (Setting.height + Setting.displayMargin - this.guideBorderHeight), this.playCanvas.width, Setting.blockHeight);
    }

    private paintGrid() {
        this.pct.strokeStyle = Setting.canvasGrid.color;
        this.pct.lineWidth = Setting.canvasGrid.width;
        for (let x = 0; x <= Setting.width; x++) {
            this.pct.beginPath();
            this.pct.moveTo(x * Setting.blockWidth, 0);
            this.pct.lineTo(x * Setting.blockWidth, this.playCanvas.height);
            this.pct.stroke();
        }
    }

    private getGraphicPosition(x: number, y: number) {
        return [Setting.blockWidth * (x / 2), this.playCanvas.height - Setting.blockHeight * (Setting.playHeight - y)];
    }

    private getNextGraphicPosition(x: number, y: number, isHold: boolean = false) {
        return [
            Setting.blockWidth * (x / 2) * (isHold ? Setting.next.scale.hold : Setting.next.scale.normal),
            isHold
                ? Setting.blockHeight * Setting.next.scale.hold * y
                : Setting.blockHeight * Setting.next.scale.hold * Setting.next.height + Setting.next.gap + Setting.blockHeight * Setting.next.scale.normal * (y - Setting.next.height),
        ];
    }

    paintNextCanvas() {
        this.nct.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        this.paintNextBackground();
        this.paintNext();
    }

    private paintNextBackground() {
        this.nct.fillStyle = Setting.backgroundColor;
        this.nct.fillRect(0, 0, Setting.blockWidth * Setting.next.width * Setting.next.scale.hold, Setting.blockHeight * Setting.next.height * Setting.next.scale.hold + Setting.next.gap / 4);
        this.nct.fillRect(
            0,
            Setting.blockHeight * Setting.next.height * Setting.next.scale.hold + (Setting.next.gap * 3) / 4,
            Setting.blockWidth * Setting.next.width * Setting.next.scale.normal,
            Setting.blockHeight * Setting.next.height * Setting.next.length + Setting.next.gap / 4
        );
        this.nct.fillStyle = Setting.next.splitColor;
        this.nct.fillRect(0, Setting.blockHeight * Setting.next.height * Setting.next.scale.hold + Setting.next.gap / 4, this.nextCanvas.width, Setting.next.gap / 2);
    }

    private paintNext() {
        const correction = Setting.next.height / 2 - Math.floor(Setting.next.height / 2);
        if (this.data.hold) {
            const hold = new Pentiamond(Setting.next.width - 1, Math.floor((Setting.next.height - 1) / 2), this.data.hold);
            const holdStates = hold.g$states;
            holdStates.forEach((state) => {
                this.paintNextBlock(state[0], state[1] + correction, [state[2], state[3], true], true);
            });
        }
        for (let i = 0; i < Math.min(Setting.next.length, this.data.next.length); i++) {
            const next = new Pentiamond(Setting.next.width - 1, Math.floor(Setting.next.height / 2) + Setting.next.height * (i + 1), this.data.next[i]);
            const nextStates = next.g$states;
            nextStates.forEach((state) => {
                this.paintNextBlock(state[0], state[1] + correction, [state[2], state[3], true]);
            });
        }
    }

    private paintNextBlock(x: number, y: number, property: BlockProperty, isHold: boolean = false) {
        if (!property[2]) {
            return;
        }
        this.nct.strokeStyle = Setting.mondGrid.normal.color;
        this.nct.fillStyle = Setting.blockColor.normal[property[0]];
        this.nct.lineWidth = Setting.mondGrid.normal.width;
        this.nct.lineJoin = "bevel";
        this.nct.lineCap = "round";
        const scale = isHold ? Setting.next.scale.hold : Setting.next.scale.normal;
        const position = this.getNextGraphicPosition(x, y, isHold);
        const p1 = arrayPlus([0, property[1] ? Setting.blockHeight * scale : 0], position);
        const p2 = arrayPlus([(Setting.blockWidth * scale) / 2, property[1] ? 0 : Setting.blockHeight * scale], position);
        const p3 = arrayPlus([Setting.blockWidth * scale, property[1] ? Setting.blockHeight * scale : 0], position);
        this.nct.beginPath();
        this.nct.moveTo(p1[0], p1[1]);
        this.nct.lineTo(p2[0], p2[1]);
        this.nct.lineTo(p3[0], p3[1]);
        this.nct.closePath();
        this.nct.fill();
        this.nct.stroke();
    }
}
