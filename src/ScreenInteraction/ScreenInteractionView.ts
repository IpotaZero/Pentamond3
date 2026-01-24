import { MappedElement } from "./ScreenInteraction";
import { qsAddEvent, qsAll, qs, getMinElement } from "../Utils";

export class ScreenInteractionView {
    focusOnPageChange = false;

    /**現在のページのMappedElements */
    private mappedElementList: MappedElement[] = [];

    updateMappedElementList(pageId: string) {
        this.mappedElementList = this.createMappedElements(pageId);
    }

    /**
     * ホバーしたmappedElementをフォーカスする
     *
     * ホバーが外れたらブラーする
     */
    setupMouseFocusing() {
        qsAll("[data-mapping]")
            .filter((e) => e instanceof HTMLElement)
            .forEach((button) => {
                this.setHoverHighlight(button);
            });
    }

    /**
     * mappedElementの中のrangeをクリックしたとき、そのmappedElementをフォーカスする
     */
    setupRangeFocusing() {
        qsAll(".rangeContainer[data-mapping]").forEach((container) => {
            container.querySelectorAll("input").forEach((element) => {
                element.addEventListener("click", () => {
                    container.focus();
                });
            });
        });
    }

    shiftFocusTo(id: string) {
        // 現在フォーカスしているものがあればフォーカスを外す
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        // ページのボタンにfocusする
        if (this.focusOnPageChange) {
            qs(`#${id} [data-mapping]`)?.focus();
            this.focusOnPageChange = false;
        }
    }

    /**
     * 今開いているページで最初のmappedElementをフォーカスする
     *  */
    focusFirstElement() {
        this.mappedElementList[0]?.element.focus();
    }

    /**
     * 今開いているページでフォーカスしているmappedElementがあればそれを返す
     *  */
    getFocusedElement() {
        return this.mappedElementList.find(({ element }) => element == document.activeElement) ?? null;
    }

    /**
     * 現在選択している要素から、移動先の要素を返す
     * 何も選択していなければ適当なmappingが設定されている要素、なければbodyを返す
     * @param param0 相対的な移動先
     * @returns 移動先のHTMLElement
     */
    getTargetElement([dx, dy]: [number | null, number | null]): HTMLElement {
        const selectedElement = this.getFocusedElement();

        if (!selectedElement) {
            if (this.mappedElementList.length > 0) {
                return this.mappedElementList[0].element;
            } else {
                return document.body;
            }
        }

        let [sx, sy] = selectedElement.coordinate;

        let target = getMinElement(
            this.mappedElementList
                .filter(({ coordinate: [x, y] }) => x == sx + (dx ?? x - sx) && y == sy + (dy ?? y - sy))
                .map(({ element: option, coordinate: [x, y] }) => ({ element: option, value: Math.hypot(x - sx, y - sy) }))
        );

        if (!target) {
            target = getMinElement(
                this.mappedElementList
                    .filter(({ coordinate: [x, y] }) => x == (dx ? x : sx) && y == (dy ? y : sy))
                    .map(({ element: option, coordinate: [x, y] }) => ({ element: option, value: (dx ? 0 : Math.sign(dy ?? 0) * y) + (dy ? 0 : Math.sign(dx ?? 0) * x) }))
            );
        }

        if (!target) {
            target = selectedElement.element;
        }

        return target;
    }

    private setHoverHighlight(button: HTMLElement): void {
        button.addEventListener("mouseover", () => {
            button.focus();
        });

        button.addEventListener("mouseleave", () => {
            if (document.activeElement == button) {
                button.blur();
            }
        });
    }

    /**
     * 指定したページのmappingが設定されている要素を取得する
     * @param pageId ページのid
     */
    private createMappedElements(pageId: string): MappedElement[] {
        const elements = qsAll(`#${pageId} [data-mapping]`);

        return elements.map((element) => ({
            element: element,
            coordinate: JSON.parse(element.dataset.mapping!) as [number, number],
        }));
    }
}
