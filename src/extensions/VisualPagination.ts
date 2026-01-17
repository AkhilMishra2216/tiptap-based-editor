import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface PaginationOptions {
    pageHeight: number;
    marginTop: number;
    marginBottom: number;
    contentPadding: number;
}

export const VisualPagination = Extension.create<PaginationOptions>({
    name: 'visualPagination',

    addOptions() {
        return {
            pageHeight: 1122,
            marginTop: 96,
            marginBottom: 96,
            contentPadding: 96,
        };
    },

    addProseMirrorPlugins() {
        const { pageHeight, contentPadding } = this.options;
        const pluginKey = new PluginKey('visualPagination');

        return [
            new Plugin({
                key: pluginKey,
                view: (view) => {
                    let isMeasuring = false;

                    const measureAndFix = () => {
                        if (isMeasuring) return;
                        isMeasuring = true;

                        const { doc } = view.state;
                        const tr = view.state.tr;
                        let hasChanges = false;

                        const maxContentHeight = pageHeight - (contentPadding * 2);

                        doc.forEach((pageNode, pageOffset) => {
                            if (pageNode.type.name !== 'page') return;

                            const pageDom = view.nodeDOM(pageOffset) as HTMLElement;
                            if (!pageDom) return;

                            const contentDom = pageDom.querySelector('.page-content') as HTMLElement;
                            if (!contentDom) return;

                            let currentPixelHeight = 0;
                            let splitPos = -1;

                            pageNode.forEach((childNode, childOffset) => {
                                if (splitPos !== -1) return;

                                const childPos = pageOffset + 1 + childOffset;
                                const childDom = view.nodeDOM(childPos) as HTMLElement;

                                if (childDom) {
                                    const style = window.getComputedStyle(childDom);
                                    const mt = parseFloat(style.marginTop) || 0;
                                    const mb = parseFloat(style.marginBottom) || 0;
                                    const height = childDom.getBoundingClientRect().height + mt + mb;

                                    if (currentPixelHeight + height > maxContentHeight) {
                                        splitPos = childPos;
                                    } else {
                                        currentPixelHeight += height;
                                    }
                                }
                            });

                            if (splitPos !== -1) {
                                const endOfPageContent = pageOffset + pageNode.nodeSize - 1;
                                const slice = doc.slice(splitPos, endOfPageContent);

                                const nextPagePos = pageOffset + pageNode.nodeSize;
                                const hasNextPage = nextPagePos < doc.content.size;

                                if (hasNextPage) {
                                    tr.insert(nextPagePos + 1, slice.content);
                                } else {
                                    const newPage = view.state.schema.nodes.page.create(null, slice.content);
                                    tr.insert(nextPagePos, newPage);
                                }

                                tr.delete(splitPos, endOfPageContent);
                                hasChanges = true;
                                return;
                            }

                            if (splitPos === -1) {
                                const nextPagePos = pageOffset + pageNode.nodeSize;
                                if (nextPagePos < doc.content.size) {
                                    const nextPageNode = doc.nodeAt(nextPagePos);
                                    if (nextPageNode && nextPageNode.type.name === 'page' && nextPageNode.childCount > 0) {
                                        const firstBlock = nextPageNode.child(0);
                                        const firstBlockPos = nextPagePos + 1;
                                        const firstBlockDom = view.nodeDOM(firstBlockPos) as HTMLElement;

                                        if (firstBlockDom) {
                                            const style = window.getComputedStyle(firstBlockDom);
                                            const mt = parseFloat(style.marginTop) || 0;
                                            const mb = parseFloat(style.marginBottom) || 0;
                                            const fbHeight = firstBlockDom.getBoundingClientRect().height + mt + mb;

                                            if (currentPixelHeight + fbHeight <= maxContentHeight) {
                                                const slice = doc.slice(firstBlockPos, firstBlockPos + firstBlock.nodeSize);

                                                const insertPos = pageOffset + pageNode.nodeSize - 1;
                                                tr.insert(insertPos, slice.content);

                                                const adjust = slice.content.size;
                                                tr.delete(firstBlockPos + adjust, firstBlockPos + adjust + firstBlock.nodeSize);

                                                if (nextPageNode.childCount === 1) {
                                                    tr.delete(nextPagePos + adjust, nextPagePos + adjust + 2);
                                                }

                                                hasChanges = true;
                                                return;
                                            }
                                        }
                                    }
                                }
                            }
                        });


                        if (hasChanges) {
                            view.dispatch(tr);
                        }

                        isMeasuring = false;
                    };

                    let timer: any;
                    const debounceMeasure = () => {
                        clearTimeout(timer);
                        timer = setTimeout(() => {
                            requestAnimationFrame(measureAndFix);
                        }, 50);
                    }

                    requestAnimationFrame(measureAndFix);

                    return {
                        update(view, prevState) {
                            if (!prevState.doc.eq(view.state.doc)) {
                                debounceMeasure();
                            }
                        },
                        destroy() {
                            clearTimeout(timer);
                        }
                    };
                },
            }),
        ];
    },
});
