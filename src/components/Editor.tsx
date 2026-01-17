"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Underline } from "@tiptap/extension-underline";
import { Toolbar } from "./Toolbar";

import { VisualPagination } from "../extensions/VisualPagination";
import { Page } from "../extensions/Page";
import { CustomDocument } from "../extensions/Document";
import { CustomHeading } from "../extensions/CustomHeading";

export const Editor = () => {
    const editor = useEditor({
        extensions: [
            CustomDocument,
            Page,
            StarterKit.configure({
                document: false,
                heading: false,
            }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Underline,
            CustomHeading,
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
          <p>This document serves as a sample draft created to demonstrate a print-accurate legal document editor.</p>
          <p>As you edit, content will automatically flow across pages using standard A4 dimensions and margins, reflecting how the document would appear when printed.</p>
          <p>You may begin drafting below using headings, paragraphs, and lists as required.</p>
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

    const [pageCount, setPageCount] = useState(1);

    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            const count = editor.state.doc.childCount;
            setPageCount(count);
        };

        editor.on('transaction', handleUpdate);
        editor.on('update', handleUpdate);

        handleUpdate();

        return () => {
            editor.off('transaction', handleUpdate);
            editor.off('update', handleUpdate);
        };
    }, [editor]);

    return (
        <div className="flex flex-col h-screen bg-[#F9FAFB] overflow-hidden font-sans">
            <div className="z-10 bg-white border-b border-gray-200 shadow-sm relative">
                <Toolbar editor={editor} />
            </div>

            <div className="flex-1 overflow-auto bg-[#F9FAFB] cursor-text flex justify-center py-8" onClick={() => editor?.commands.focus()}>
                <EditorContent
                    editor={editor}
                    className="w-full max-w-screen-xl"
                />
            </div>

            <div className="bg-white border-t border-gray-200 py-1.5 px-6 text-[10px] text-gray-400 flex justify-between select-none">
                <span>Page count: {pageCount}</span>
                <span>Ready</span>
            </div>
        </div>
    );
};
