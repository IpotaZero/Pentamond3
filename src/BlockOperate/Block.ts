/**
 * ブロックの種類
 */
export type BlockKind = "L" | "J" | "p" | "q" | "U" | "I" | "g";

export type BlockProperty = [BlockKind, boolean, boolean];

/**
 * ブロックの表示している形の状態
 */
export type ShapeInfo = [boolean, boolean];

/**
 * 仮想的な表示単位
 * 実際の描画処理はここではない
 */
export class Block {
    /**
     * この表示単位の表す色の種類
     */
    private kind: BlockKind = "g";
    /**
     * 上向き(上がとがっている、true)か下向きか
     */
    private direction: boolean = true;
    /**
     * 表示状態
     */
    private visible: boolean = false;

    constructor() {}

    /**
     * 種類
     */
    get g$kind(): BlockKind {
        return this.kind;
    }

    /**
     * 上向き(true)か下向き(false)か
     */
    get g$direction(): boolean {
        return this.direction;
    }

    /**
     * 表示しているか
     */
    get g$visible(): boolean {
        return this.visible;
    }

    /**
     * 形の情報
     */
    get g$shapeInfo(): ShapeInfo {
        return [this.direction || !this.visible, this.visible];
    }

    /**
     * プロパティ
     */
    get g$property(): BlockProperty {
        return [this.kind, this.direction, this.visible];
    }

    /**
     * 表示中は変更できない
     * @param kind 種類
     */
    set s$kind(kind: BlockKind) {
        console.assert(!this.visible, "表示中に種類を変更しないでください");
        this.kind = kind;
    }

    /**
     * 上向き(true)か下向き(false)かを設定する　表示中は変更できない
     * @param direction 向き
     */
    set s$direction(direction: boolean) {
        console.assert(!this.visible, "表示中に方向を変更しないでください");
        this.direction = direction;
    }

    /**
     *@param visible 表示状態
     */
    set s$visible(visible: boolean) {
        this.visible = visible;
    }

    /**
     * プロパティの一括設定
     * @param kind 種類
     * @param direction 上向き(true)か下向きか(false)
     * @param visible 表示状態
     */
    set s$property([kind, direction, visible]: BlockProperty) {
        this.kind = kind;
        this.direction = direction;
        this.visible = visible;
    }
}
