import { EventId, EventManager, MyEventListener } from "./EventManager.js";

export type PageManagerOption = {
    eventIgnore?: boolean;
};

export class PageManager implements MyEventListener {
    private initialized: boolean = false;
    private currentPage: HTMLElement | null = null;
    private displayingPages: HTMLElement[] = [];
    private pageMemory: string[][] = [];
    private static instance: PageManager;
    /**
     * @param pageIsReady initが終了したとき
     * @param pageOpened -ページ名　ページが進んだとき　または　同一レイヤーのページに戻るとき
     * @param pageChanged -ページ名　ページが変更されたとき
     * @param setPage -ページ名　ページを進んだ時
     * @param backPages ページを戻った時
     * @param pageBecomeValid ページが有効になったとき
     * @param pageBecomeInvalid ページが無効になったとき
     */
    readonly eventClassNames: string[] = ["pageIsReady", "pageOpened", "pageChanged", "setPage", "backPages", "pageBecomeValid", "pageBecomeInvalid", "setSubPage"];
    //setPage-ページ名、pageChanged-ページ名
    addEvent(classNames: string[], handler: Function): EventId {
        return EventManager.addEvent({ classNames, handler });
    }

    //シングルトン
    constructor() {
        if (PageManager.instance) {
            return PageManager.instance;
        }
        PageManager.instance = this;
    }

    /**
     * 初期化されているか
     */
    get g$initialized(): boolean {
        return this.initialized;
    }

    /**
     * 現在のページの要素
     */
    get g$currentPage(): HTMLElement | null {
        return this.currentPage;
    }

    /**
     * 現在のページのid
     */
    get g$currentPageId(): string | null {
        return this.currentPage ? this.currentPage.id : null;
    }

    /**
     * 表示されているページの配列
     */
    get g$displayingPages(): HTMLElement[] {
        return [...this.displayingPages];
    }

    /**
     * ページの遷移記録
     */
    get g$pageMemory(): string[][] {
        return structuredClone(this.pageMemory);
    }

    /**
     * 現在のページのレイヤー
     */
    get g$currentLayer(): number | null {
        return parseInt(this.currentPage!.dataset.layer || "0");
    }

    //DOMが読み込まれてから読み込んでね
    init() {
        if (this.initialized) {
            return;
        }
        //最初に開くページ
        const initialPageId = document.body.dataset.initialPage || "title";
        this.setPage(initialPageId);

        //pageを戻る処理
        document.querySelectorAll(".back, [data-back]").forEach((element) => {
            element.addEventListener("click", () => {
                const back = parseInt((element as HTMLElement).dataset.back || "1");
                this.backPages(back);
            });
        });

        //page遷移処理
        document.querySelectorAll("[data-page]").forEach((element) => {
            element.addEventListener("click", () => {
                const pageId = (element as HTMLElement).dataset.page;
                if (pageId) {
                    this.setPage(pageId);
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
                    const length = Array.from(element.querySelectorAll<HTMLElement>(".subPage")).length;
                    const prevIndex = (length + this.getSubPageIndex(element)! - 1) % length;
                    this.setSubPage(prevIndex);
                });
            });
            nextElements.forEach((next) => {
                next.addEventListener("click", () => {
                    const length = Array.from(element.querySelectorAll<HTMLElement>(".subPage")).length;
                    const nextIndex = (this.getSubPageIndex(element)! + 1) % length;
                    this.setSubPage(nextIndex);
                });
            });
        });

        this.initialized = true;
        EventManager.executeEventsByClassName("pageIsReady");
    }

    //すべてのページの表示状態を設定する
    private setPages(pageIds: string[], options?: PageManagerOption) {
        // 新しいページを取得
        const nextPages = pageIds.map((pageId) => document.getElementById(pageId) || null);
        if (nextPages.includes(null)) {
            console.error("指定されたpageIdsに存在しないページが含まれていました");
            return;
        }

        this.displayingPages.forEach((page) => {
            page.style.display = "none";
        });

        nextPages.forEach((page) => {
            page!.style.display = "flex";
        });

        let preliminaryCurrentPage: HTMLElement | null = null;
        nextPages.forEach((page) => {
            const layer = parseInt(page!.dataset.layer || "0");
            let preliminaryMaxLayer = preliminaryCurrentPage ? parseInt(preliminaryCurrentPage.dataset.layer || "0") : 0;
            if (preliminaryMaxLayer < layer || preliminaryCurrentPage == null) {
                preliminaryCurrentPage = page;
                preliminaryMaxLayer = layer;
            } else if (preliminaryMaxLayer == layer && preliminaryCurrentPage != null) {
                console.error("最大layerが一意になっていません");
            }
        });

        this.currentPage = preliminaryCurrentPage as HTMLElement | null;
        this.displayingPages = nextPages as HTMLElement[];
        this.pageMemory.push(pageIds);
        this.setSubPage(0, { eventIgnore: true });
        if (!(options && options.eventIgnore)) {
            EventManager.executeEventsByClassName("pageChanged");
            EventManager.executeEventsByClassName("pageChanged-" + (this.currentPage ? this.currentPage.id : ""));
        }
    }

    //指定したpageIdのページを開く
    //現在のページと同じlayerを開く場合は現在のページは閉じ、上のlayerを開く場合は開いたままにする
    setPage(pageId: string, options?: PageManagerOption) {
        // 新しいページを取得
        const nextPage = document.getElementById(pageId);
        if (!nextPage) {
            console.error("指定されたpageIdのページは存在しません:" + pageId);
            return;
        }

        let nextDisplayingPages = [...this.displayingPages];

        // 現在のページを非表示にする
        if (this.currentPage) {
            const currentLayer = parseInt(this.currentPage.dataset.layer || "0");
            const nextLayer = parseInt(nextPage.dataset.layer || "0");
            //同じlayerなら元のページは非表示
            if (nextLayer == currentLayer) {
                nextDisplayingPages = nextDisplayingPages.filter((page) => page.id != this.currentPage!.id);
            } else if (nextLayer < currentLayer) {
                throw new Error("現在のlayerを下回るlayerのページには遷移できません");
            }
        }
        nextDisplayingPages.push(nextPage);
        this.setPages(
            nextDisplayingPages.map((page) => page.id),
            options
        );
        if (!(options && options.eventIgnore)) {
            EventManager.executeEventsByClassName("setPage");
            EventManager.executeEventsByClassName("setPage-" + pageId);
            EventManager.executeEventsByClassName("pageOpened");
            EventManager.executeEventsByClassName("pageOpened-" + pageId);
        }
    }

    //numberの数だけ前のページの状態に戻る
    backPages(number: number, options?: PageManagerOption) {
        if (number == -1) {
            number = this.pageMemory.length - 1;
        }
        if (this.pageMemory.length < number + 1 || number < -1) {
            console.log("ページ遷移の記録がないため戻ることはできません");
            return;
        }
        const currentLayer = this.g$currentLayer!;
        this.setPages(this.pageMemory[this.pageMemory.length - number - 1], options);
        this.pageMemory = this.pageMemory.slice(0, -number - 1);
        if (!(options && options.eventIgnore)) {
            if (currentLayer == this.g$currentLayer) {
                EventManager.executeEventsByClassName("pageOpened");
                EventManager.executeEventsByClassName("pageOpened-" + this.currentPage!.id);
            }
            EventManager.executeEventsByClassName("backPages");
        }
    }

    //すべてのページを非表示にする
    //invalidPanelが存在する場合は表示する
    set s$valid(valid: boolean) {
        this.displayingPages.forEach((page) => {
            page.style.display = valid ? "flex" : "none";
        });
        const invalidPanel = document.getElementById("invalidPanel");
        if (invalidPanel) {
            invalidPanel.style.display = valid ? "none" : "flex";
        }
        EventManager.executeEventsByClassName(valid ? "pageBecomeValid" : "pageBecomeInvalid");
    }

    /**
     * @param pageId 指定するpageId
     * @returns 最後に指定したpageを開いている状態は何回前か 存在しなければ-1
     */
    getLatestBackIndex(pageId: string): number {
        const index =
            this.pageMemory.length -
            1 -
            this.pageMemory.findLastIndex((memory) => {
                return memory.includes(pageId);
            });
        return index == this.pageMemory.length ? -1 : index;
    }

    /**
     * 最後に指定したpageを開いている状態まで戻す　存在しなければ何もしない
     * @param pageId 指定するpageId
     */
    backLatestPage(pageId: string, options?: PageManagerOption) {
        const index = this.getLatestBackIndex(pageId);
        if (index == -1) {
            return;
        }
        this.backPages(index, options);
    }

    setSubPage(index: number, options?: PageManagerOption) {
        if (!this.currentPage || !this.currentPage.querySelector(`.subPage`)) {
            return;
        }
        const subPages = Array.from(this.currentPage.querySelectorAll<HTMLElement>(".subPage"));
        const subPageLabel = this.currentPage.querySelector(".subPageLabel");
        subPages.forEach((subPage, i) => {
            if (i == index) {
                subPage.style.display = "";
                if (subPageLabel) {
                    subPageLabel.innerHTML = `${index + 1} / ${subPages.length}`;
                }
            } else {
                subPage.style.display = "none";
            }
        });
        if (!(options && options.eventIgnore)) {
            EventManager.executeEventsByClassName("setSubPage");
        }
    }

    getSubPageIndex(page: HTMLElement): number | null {
        if (!page || !page.querySelector(`.subPage`)) {
            return null;
        }
        const subPages = Array.from(page.querySelectorAll<HTMLElement>(".subPage"));
        return subPages.findIndex((subPage) => subPage.style.display != "none");
    }
}

export const pageManager: PageManager = new PageManager();
