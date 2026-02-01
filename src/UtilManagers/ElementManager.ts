import { EventId, EventManager, MyEventListener } from "./EventManager.js";
import { pageManager } from "./PageManager.js";

export class ElementManager implements MyEventListener {
    private initialized: boolean = false;
    private static instance: ElementManager;
    /**
     * @param selectorChanged-セレクター名 セレクター変更時
     */
    readonly eventClassNames: string[] = ["selectorChanged"];
    //setPage-ページ名、pageChanged-ページ名
    addEvent(classNames: string[], handler: Function): EventId {
        return EventManager.addEvent({ classNames, handler });
    }

    //シングルトン
    constructor() {
        if (ElementManager.instance) {
            return ElementManager.instance;
        }
        ElementManager.instance = this;
    }

    /**
     * 初期化されているか
     */
    get g$initialized(): boolean {
        return this.initialized;
    }

    //DOMが読み込まれてから読み込んでね
    init() {
        if (this.initialized) {
            return;
        }
        pageManager.init();

        //pageを戻る処理
        document.querySelectorAll(".back, [data-back]").forEach((element) => {
            element.addEventListener("click", () => {
                const back = parseInt((element as HTMLElement).dataset.back || "1");
                pageManager.backPages(back);
            });
        });

        //page遷移処理
        document.querySelectorAll("[data-page]").forEach((element) => {
            element.addEventListener("click", () => {
                const pageId = (element as HTMLElement).dataset.page;
                if (pageId) {
                    pageManager.setPage(pageId);
                }
            });
        });

        //layerの反映
        document.querySelectorAll(".page[data-layer]").forEach((element) => {
            const layer = (element as HTMLElement).dataset.layer;
            (element as HTMLElement).style.zIndex = layer || "0";
        });

        //subPageの挙動
        document.querySelectorAll<HTMLElement>(".page:has(.subPageNext)").forEach((element) => {
            const prevElements = Array.from(element.querySelectorAll<HTMLElement>(".subPagePrev"));
            const nextElements = Array.from(element.querySelectorAll<HTMLElement>(".subPageNext"));
            prevElements.forEach((prev) => {
                prev.addEventListener("click", () => {
                    pageManager.setSubPage(this.getSubPageIndex(element)! - 1);
                });
            });
            nextElements.forEach((next) => {
                next.addEventListener("click", () => {
                    pageManager.setSubPage(this.getSubPageIndex(element)! + 1);
                });
            });
        });

        //selectorの選択時処理
        document.querySelectorAll<HTMLElement>(".scrollableContainer button").forEach((element) => {
            element.addEventListener("click", () => {
                const pageId = this.getParentPageId(element);
                const selector = document.querySelector<HTMLElement>(`.selector[data-page=${pageId}]`);
                if (!pageId || !selector) {
                    return;
                }
                selector.innerText = element.innerText;
                document
                    .getElementById(pageId)
                    ?.querySelectorAll<HTMLElement>(".scrollableContainer button")
                    .forEach((element2) => {
                        element2.classList.remove("selectedValue");
                    });
                element.classList.add("selectedValue");
                pageManager.backPages(1);
                EventManager.executeEventsByClassName("selectorChanged");
                EventManager.executeEventsByClassName(`selectorChanged-${pageId}`);
            });
        });

        //selector表示時の更新
        document.querySelectorAll<HTMLElement>(".page:has(.selector)").forEach((element) => {
            const selectors = element.querySelectorAll<HTMLElement>(".selector");
            selectors.forEach((selector) => {
                const selectorName = selector.dataset.page!;
                const selectedValue = document.querySelector<HTMLElement>(`#${selectorName} .scrollableContainer .selectedValue`);
                if (selectedValue) {
                    selector.innerText = selectedValue.innerText;
                } else {
                    selector.innerText = "未選択";
                }
            });
        });

        //selectorの選択ページにおいて、選択済みのものがあるならそれにfocusする
        pageManager.addEvent(["setPage"], () => {
            const page = pageManager.g$currentPage;
            if (!page) {
                return;
            }
            const selectedValue = page.querySelector<HTMLElement>(`.scrollableContainer .selectedValue`);
            if (selectedValue) {
                selectedValue.focus();
            }
        });

        this.initialized = true;
    }

    getParentPageId(element: HTMLElement): string {
        let checkElement = element;
        while (checkElement.parentElement && !checkElement.classList.contains("page")) {
            checkElement = checkElement.parentElement;
        }
        if (checkElement.classList.contains("page")) {
            return checkElement.id;
        } else {
            return "";
        }
    }

    getSelectedIndex(selectorName: string): number {
        const page = document.getElementById(selectorName);
        const selector = document.querySelector<HTMLElement>(`.selector[data-page=${selectorName}`);
        if (!page || !selector) return -1;

        const values = Array.from(page.querySelectorAll<HTMLElement>(".scrollableContainer button"));
        return values.findIndex((value) => value.classList.contains("selectedValue"));
    }

    selectByIndex(selectorName: string, index: number) {
        const page = document.getElementById(selectorName);
        const selector = document.querySelector<HTMLElement>(`.selector[data-page=${selectorName}`);
        if (!page || !selector) return;

        const values = Array.from(page.querySelectorAll<HTMLElement>(".scrollableContainer button"));
        if (index < 0 || values.length <= index) return;

        values.forEach((value) => {
            value.classList.remove("selectedValue");
        });
        values[index].classList.add("selectedValue");
        selector.innerText = values[index].innerText;
    }

    getSubPageIndex(page: HTMLElement): number | null {
        if (!page || !page.querySelector(`.subPage`)) {
            return null;
        }
        const subPages = Array.from(page.querySelectorAll<HTMLElement>(".subPage"));
        return subPages.findIndex((subPage) => subPage.style.display != "none");
    }

    scrollCenter(element: HTMLElement): void {
        const y = element.clientHeight / 2 + element.getBoundingClientRect().y;
        const parent = element.parentElement;
        if (!parent) {
            return;
        }
        const parentY = parent.clientHeight / 2 + parent.getBoundingClientRect().y;
        if (Math.abs(y - parentY) > (parent.clientHeight / 2) * 0.6) {
            element.scrollIntoView({
                block: "center",
                behavior: "smooth",
            });
        }
    }
}

export const elementManager: ElementManager = new ElementManager();
