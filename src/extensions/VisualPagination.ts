import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface PaginationOptions {
    pageHeight: number;
    marginTop: number; // For information only, measurements use CSS
    marginBottom: number;
    contentPadding: number;
}

export const VisualPagination = Extension.create<PaginationOptions>({
    name: 'visualPagination',

    addOptions() {
        return {
            pageHeight: 1122, // A4 height in px (approx)
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

                        // Max content height allowed in a page
                        const maxContentHeight = pageHeight - (contentPadding * 2);

                        // Iterate pages
                        doc.forEach((pageNode, pageOffset) => {
                            if (pageNode.type.name !== 'page') return;

                            const pageDom = view.nodeDOM(pageOffset) as HTMLElement;
                            if (!pageDom) return;

                            const contentDom = pageDom.querySelector('.page-content') as HTMLElement;
                            if (!contentDom) return;

                            let currentPixelHeight = 0;
                            let splitPos = -1;

                            // pageOffset + 1 is start of page content
                            pageNode.forEach((childNode, childOffset) => {
                                if (splitPos !== -1) return; // Already found split

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
                                // Move overflowing content to next page
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
                                return; // Stop processing to avoid layout thrashing
                            }

                            // Check for Underflow (Pull back from next page)
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

                                            // Conservative check: Only pull if it clearly fits
                                            if (currentPixelHeight + fbHeight <= maxContentHeight) {
                                                const slice = doc.slice(firstBlockPos, firstBlockPos + firstBlock.nodeSize);

                                                // Delete from next page first (to avoid pos shifting issues if we insert first? No, standard TR mapping handles it, but let's be explicit)
                                                // Actually, best practice: Insert, then Delete. IDs are preserved.

                                                const insertPos = pageOffset + pageNode.nodeSize - 1;
                                                tr.insert(insertPos, slice.content);

                                                // The firstBlockPos has shifted by slice.size because we inserted locally? 
                                                // No, insert is at insertPos (which is < firstBlockPos).
                                                // So firstBlockPos shifts by slice.size.

                                                const adjust = slice.content.size;
                                                tr.delete(firstBlockPos + adjust, firstBlockPos + adjust + firstBlock.nodeSize);

                                                // Check if next page is now empty
                                                // We can't easily check 'tr.doc' state in middle of transaction without 'tr.doc' which recalculates.
                                                // But we know nextPageNode had childCount.
                                                if (nextPageNode.childCount === 1) {
                                                    // It was 1, we moved 1. Now 0.
                                                    // Delete the empty page.
                                                    // Page starts at nextPagePos + adjust (because of insert).
                                                    // Its size is 2 (empty).
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

                    // Initial measure
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
