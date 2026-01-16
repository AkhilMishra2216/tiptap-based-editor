import { Node, mergeAttributes } from '@tiptap/core';

export const Page = Node.create({
    name: 'page',

    group: 'block',

    content: 'block+',

    defining: true,

    isolating: true,

    parseHTML() {
        return [
            { tag: 'div.page' },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, { class: 'page' }), // Outer A4 container
            // We can't easily put "structural" HTML like a footer *after* the content hole in simple renderHTML 
            // if we want standard schema behavior, but we can do it.
            // However, for Tiptap, the "content hole" is usually the last element or specified by 0.
            // Let's keep it simple: The .page is the container. 
            // We'll use CSS pseduo-elements or absolute positioning for the footer logic 
            // OR we can make a NodeView if we need dynamic page numbers.
            // For now, let's just make the container. The logic in VisualPagination can manage attributes if needed.
            ['div', { class: 'page-content' }, 0], // The content hole
            //   ['div', { class: 'page-footer', contenteditable: 'false' }, 'Page'] // Static Footer for now
        ];
    },

    addAttributes() {
        return {
            pageNumber: {
                default: 1,
            },
            class: {
                default: 'page',
            },
        };
    },
});
