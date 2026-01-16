"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Underline } from "@tiptap/extension-underline";
import { Heading } from "@tiptap/extension-heading";
import { Toolbar } from "./Toolbar";

import { VisualPagination } from "../extensions/VisualPagination";
import { Page } from "../extensions/Page";
import { CustomDocument } from "../extensions/Document";

export const Editor = () => {
    const editor = useEditor({
        extensions: [
            CustomDocument, // Replaces default Document
            Page,
            StarterKit.configure({
                document: false, // Important: disable default Document
            }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Underline,
            Heading.configure({
                levels: [1, 2],
            }),
            VisualPagination.configure({
                pageHeight: 1122,
                marginTop: 96,
                marginBottom: 96,
                contentPadding: 96,
            }),
        ],
        content: `
      <div class="page">
        <div class="page-content">
          <h1>Legal Document Draft</h1>
          <p>This document uses a <strong>Schema-Based Pagination</strong> system.</p>
          <p>Every block of content exists inside a physical <code>Page</code> node.</p>
          <p>Try typing enough content to fill this page. The system will automatically move overflowing content to a new Page node.</p>
          <p>The "Footer" you see below is generated via CSS counters, ensuring it is always correct and visually consistent.</p>
        </div>
      </div>
    `,
        editorProps: {
            attributes: {
                class: "focus:outline-none",
            },
        },
        immediatelyRender: false,
    });

    // Reactive Block Count (Optional debug)
    const [pageCount, setPageCount] = useState(1);

    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            // We can count page nodes directly
            const count = editor.state.doc.childCount;
            setPageCount(count);
        };

        editor.on('transaction', handleUpdate);
        editor.on('update', handleUpdate);

        handleUpdate(); // Initial

        return () => {
            editor.off('transaction', handleUpdate);
            editor.off('update', handleUpdate);
        };
    }, [editor]);

    return (
        <div className="flex flex-col h-screen bg-[#F9FAFB] overflow-hidden font-sans">
            {/* Toolbar Area with Hierarchy */}
            <div className="z-10 bg-white border-b border-gray-200 shadow-sm relative">
                <Toolbar editor={editor} />
            </div>

            {/* Editor Canvas */}
            <div className="flex-1 overflow-auto bg-[#F9FAFB] cursor-text flex justify-center py-8" onClick={() => editor?.commands.focus()}>
                {/* 
                  The EditorContent is now the direct scroll container or child of it. 
                  The .ProseMirror class inside handles the flex layout of pages.
               */}
                <EditorContent
                    editor={editor}
                    className="w-full max-w-screen-xl"
                />
            </div>

            {/* Status Bar (Optional, can be removed or refined) */}
            <div className="bg-white border-t border-gray-200 py-1.5 px-6 text-[10px] text-gray-400 flex justify-between select-none">
                <span>Page count: {pageCount}</span>
                <span>Ready</span>
            </div>
        </div>
    );
};
