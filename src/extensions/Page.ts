import { Node, mergeAttributes } from '@tiptap/core';

export const Page = Node.create({
    name: 'page',

    group: 'block',

    content: '(paragraph | heading | bulletList | orderedList | table | blockquote | codeBlock | horizontalRule)+',

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
            mergeAttributes(HTMLAttributes, { class: 'page' }),
            ['div', { class: 'page-content' }, 0],
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
