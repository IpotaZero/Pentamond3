import { qs, qsAddEvent } from "./Utils";

export class GraphicSetting {
    static putShake = true;
    static removeShake = true;
    static playBackground = true;

    static init() {
        this.loadData();
        this.setupEvents();
    }

    static saveGraphicSetting() {
        const data = this.getEncodedSetting();

        try {
            localStorage.setItem("Pentamond3-graphicSetting", data);
        } catch (error) {
            console.error("何らかの理由により設定の保存に失敗しました");
        }

        this.updateButtonStyle();
    }

    private static updateButtonStyle() {
        qs("#putShakeOn").style.color = this.putShake ? "#ee8888" : "";
        qs("#putShakeOff").style.color = this.putShake ? "" : "#ee8888";
        qs("#removeShakeOn").style.color = this.removeShake ? "#ee8888" : "";
        qs("#removeShakeOff").style.color = this.removeShake ? "" : "#ee8888";
        qs("#playBackgroundOn").style.color = this.playBackground ? "#ee8888" : "";
        qs("#playBackgroundOff").style.color = this.playBackground ? "" : "#ee8888";
    }

    private static loadData() {
        const json = localStorage.getItem("Pentamond3-graphicSetting");

        if (!json) {
            this.saveGraphicSetting();
            return;
        }

        const data = this.decode(json);

        this.putShake = data[0];
        this.removeShake = data[1];
        this.playBackground = data[2];

        this.updateButtonStyle();
    }

    private static setupEvents() {
        qsAddEvent("#putShakeOn", "click", () => {
            if (this.putShake) {
                return;
            }
            this.putShake = true;
        });
        qsAddEvent("#putShakeOff", "click", () => {
            if (!this.putShake) {
                return;
            }
            this.putShake = false;
        });
        qsAddEvent("#removeShakeOn", "click", () => {
            if (this.removeShake) {
                return;
            }
            this.removeShake = true;
        });
        qsAddEvent("#removeShakeOff", "click", () => {
            if (!this.removeShake) {
                return;
            }
            this.removeShake = false;
        });
        qsAddEvent("#playBackgroundOn", "click", () => {
            if (this.playBackground) {
                return;
            }
            this.playBackground = true;
        });
        qsAddEvent("#playBackgroundOff", "click", () => {
            if (!this.playBackground) {
                return;
            }
            this.playBackground = false;
        });

        qsAddEvent("#graphicSetting button", "click", () => {
            this.saveGraphicSetting();
        });
    }

    private static getEncodedSetting() {
        return Number.parseInt([this.putShake ? "1" : "0", this.removeShake ? "1" : "0", this.playBackground ? "1" : "0"].join(""), 2) + "";
    }

    private static decode(json: string) {
        const data = Number.parseInt(json, 10)
            .toString(2)
            .split("")
            .map((word) => (word == "0" ? false : true));

        for (let i = 0; 3 - data.length; i++) {
            data.unshift(false);
        }

        return data;
    }
}
