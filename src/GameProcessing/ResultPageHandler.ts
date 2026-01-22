import { GamePlayer } from "../Game/GamePlayer";
import { PlaySetting } from "./GameProcessing";
import { qsAll, qs } from "../Utils";

/**
 * ResultPageに関する、状態を持たない関数群
 */
export class ResultPageHandler {
    private static readonly parser = new DOMParser();

    //詳細結果の中身を作成する
    static updateDetailedResultPage(players: GamePlayer[], playSetting: PlaySetting) {
        // 前の結果を消す
        qsAll("#detailedResult .subPage").forEach((subPage) => {
            subPage.remove();
        });

        const subPageController = qs("#detailedResult .subPageController");

        const resultTitlePage = this.createResultTitlePage(players, playSetting);
        subPageController.before(resultTitlePage);

        players.forEach((player, index) => {
            const page = this.createPlayerResultPage(playSetting, player, index);
            subPageController.before(page);
        });
    }

    private static createResultTitlePage(players: GamePlayer[], playSetting: PlaySetting) {
        const html = `
            <div class="subPage">
                <div class="text">
                    Player人数 : ${players.length}<br />
                    モード : ${playSetting.mode == 1 ? "サバイバル" : "十五列揃え"}<br />
                    ${players.length != 1 ? `勝者 : ${qs(".resultLabel").innerHTML}<br />` : ""}
                </div>
            </div>    
        `;

        return this.parser.parseFromString(html, "text/html").body.firstElementChild!;
    }

    private static createPlayerResultPage(playSetting: PlaySetting, p: GamePlayer, i: number) {
        const html = `
            <div class="subPage">
                <div class="text">
                    Player : ${i + 1}<br />
                    ${[1].includes(playSetting.mode) ? `開始Time : ${p.playInfo.maxGameTime}<br />` : ""}
                    ${[1].includes(playSetting.mode) ? `残りTime : ${p.playInfo.gameTime}<br />` : ""}
                    プレイ時間 : ${(p.playInfo.playTime / 1000).toFixed(2)}<br />
                    役の回数 : ${p.playInfo.trickCount}<br />
                    一列揃え : ${p.playInfo.line}<br />
                    最大Chain : ${p.playInfo.maxChain}<br />
                    Score : ${p.playInfo.score}<br />
                </div>
                <div class="text">
                    ペナルティ : ${p.playInfo.penalty}<br />
                    回復 : ${p.playInfo.recovery}<br />
                    余剰回復 : ${p.playInfo.surplus}<br />
                    設置 : ${p.playInfo.put}<br />
                    ホールド : ${p.playInfo.hold}<br />
                    一手戻し : ${p.playInfo.unput}<br />
                    消去 : ${p.playInfo.remove}<br />
                </div>
                <div class="text">
                    合計ダメージ : ${p.damageInfo.totalDamage}<br />
                    合計攻撃 : ${p.damageInfo.totalAttack}<br />
                    ハンデ : ×${p.playInfo.handy}<br />
                </div>
            </div>
        `;

        return this.parser.parseFromString(html, "text/html").body.firstElementChild!;
    }
}
