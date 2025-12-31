import { inputManager } from "../Interaction/InputManager";
import { qsAll } from "../Utils";

type InformationLabel = {
    name: string;
    label: HTMLDivElement;
    content: string;
    visible: boolean;
};

export class InformationLabelManager {
    private labels = {
        gameTime: {
            name: "Time",
            label: document.createElement("div"),
            content: "",
            visible: false,
        },
        playTime: {
            name: "Time",
            label: document.createElement("div"),
            content: "",
            visible: false,
        },
        line: {
            name: "Line",
            label: document.createElement("div"),
            content: "",
            visible: false,
        },
        lastTrick: {
            name: "Trick",
            label: document.createElement("div"),
            content: "",
            visible: false,
        },
        chain: {
            name: "Chain",
            label: document.createElement("div"),
            content: "",
            visible: false,
        },
        score: {
            name: "Score",
            label: document.createElement("div"),
            content: "",
            visible: false,
        },
    };

    private base: HTMLDivElement = document.createElement("div");
    constructor(
        {
            gameTime,
            playTime,
            line = false,
            lastTrick,
            chain,
            score,
        }: {
            gameTime: boolean;
            playTime: boolean;
            line: boolean;
            lastTrick: boolean;
            chain: boolean;
            score: boolean;
        } = {
            gameTime: false,
            playTime: false,
            line: false,
            lastTrick: false,
            chain: false,
            score: false,
        }
    ) {
        this.s$visible = { gameTime, playTime, line, lastTrick, chain, score };
        Object.values(this.labels).forEach((element) => {
            element.label.classList.add("informationLabel");
            this.base.appendChild(element.label);
            if (element.name == "Trick") {
                if (inputManager.g$registeredInputNumber == 1) {
                    element.label.style.fontSize = "3vh";
                } else {
                    element.label.style.fontSize = `calc((100vh * 14 / 9 / ${inputManager.g$registeredInputNumber}) /33)`;
                }
            } else if (element.name == "Score") {
                if (inputManager.g$registeredInputNumber == 1) {
                    element.label.style.fontSize = "4vh";
                } else {
                    element.label.style.fontSize = `calc((100vh * 14 / 9 / ${inputManager.g$registeredInputNumber}) /28)`;
                }
            } else {
                if (inputManager.g$registeredInputNumber == 1) {
                    element.label.style.fontSize = "6vh";
                } else {
                    element.label.style.fontSize = `calc((100vh * 14 / 9 / ${inputManager.g$registeredInputNumber}) /17)`;
                }
            }
        });
        if (inputManager.g$registeredInputNumber == 1) {
            this.labels.playTime.label.style.fontSize = "4vh";
        } else {
            this.labels.playTime.label.style.fontSize = `calc((100vh * 14 / 9 / ${inputManager.g$registeredInputNumber}) /28)`;
        }

        this.base.classList.add("informationLabelBase");
        // this.labels.lastTrick.label.style.fontSize = "3vh";
    }
    get g$element() {
        return this.base;
    }

    set s$visible({ gameTime, playTime, line, lastTrick, chain, score }: { gameTime: boolean; playTime: boolean; line: boolean; lastTrick: boolean; chain: boolean; score: boolean }) {
        [this.labels.gameTime.visible, this.labels.playTime.visible, this.labels.line.visible, this.labels.lastTrick.visible, this.labels.chain.visible, this.labels.score.visible] = [
            gameTime,
            playTime,
            line,
            lastTrick,
            chain,
            score,
        ];
        this.labels.gameTime.label.style.display = gameTime ? "" : "none";
        this.labels.playTime.label.style.display = playTime ? "" : "none";
        this.labels.line.label.style.display = line ? "" : "none";
        this.labels.lastTrick.label.style.display = lastTrick ? "" : "none";
        this.labels.chain.label.style.display = chain ? "" : "none";
        this.labels.score.label.style.display = score ? "" : "none";
    }

    updateContents({ gameTime, playTime, line, lastTrick, chain, score }: { gameTime?: string; playTime?: string; line?: string; lastTrick?: string; chain?: string; score?: string }) {
        if (gameTime != undefined && this.labels.gameTime.visible && this.labels.gameTime.content != gameTime) {
            this.labels.gameTime.content = gameTime;
            this.labels.gameTime.label.innerHTML = `<div class="informationLabelHeader">${this.labels.gameTime.name}</div>` + gameTime;
        }
        if (playTime != undefined && this.labels.playTime.visible && this.labels.playTime.content != playTime) {
            this.labels.playTime.content = playTime;
            this.labels.playTime.label.innerHTML = `<div class="informationLabelHeader">${this.labels.playTime.name}</div>` + playTime;
        }
        if (line != undefined && this.labels.line.visible && this.labels.line.content != line) {
            this.labels.line.content = line;
            this.labels.line.label.innerHTML = `<div class="informationLabelHeader">${this.labels.line.name}</div>` + line;
        }
        if (lastTrick != undefined && this.labels.lastTrick.visible && this.labels.lastTrick.content != lastTrick) {
            this.labels.lastTrick.content = lastTrick;
            this.labels.lastTrick.label.innerHTML = `<div class="informationLabelHeader">${this.labels.lastTrick.name}</div>` + lastTrick;
        }
        if (chain != undefined && this.labels.chain.visible && this.labels.chain.content != chain) {
            this.labels.chain.content = chain;
            this.labels.chain.label.innerHTML = `<div class="informationLabelHeader">${this.labels.chain.name}</div>` + chain;
        }
        if (score != undefined && this.labels.score.visible && this.labels.score.content != score) {
            this.labels.score.content = score;
            this.labels.score.label.innerHTML = `<div class="informationLabelHeader">${this.labels.score.name}</div>` + score;
        }
        qsAll(".informationLabelHeader").forEach((element) => {
            if (inputManager.g$registeredInputNumber == 1) {
                element.style.fontSize = "4vh";
            } else {
                element.style.fontSize = `calc((100vh * 14 / 9 / ${inputManager.g$registeredInputNumber}) /22)`;
            }
        });
    }
}
