"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Underline } from "@tiptap/extension-underline";
import { Heading } from "@tiptap/extension-heading";
import { Toolbar } from "./Toolbar";


const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 25.4; // 1 inch
const MM_TO_PX = 3.7795275591; // 1mm = 3.78px @ 96dpi

const PAGE_HEIGHT_PX = PAGE_HEIGHT_MM * MM_TO_PX;
const PAGE_WIDTH_PX = PAGE_WIDTH_MM * MM_TO_PX;
const MARGIN_PX = MARGIN_MM * MM_TO_PX;

export const Editor = () => {
    // Calculate content height to determine how many pages we need
    const [contentHeight, setContentHeight] = useState(0);
    const editorRef = useRef<HTMLDivElement>(null);

    // We count pages based on the content height relative to page height
    // We add a gap between pages for visual separation
    const GAP_HEIGHT_PX = 30; // 30px gap

    // Pagination Logic:
    // The "Editor" layer has padding equal to MARGIN_PX.
    // The content (ProseMirror) lives inside that padding.
    // So the content flows into the "Safe Area" of the pages.
    // Safe Area Height = PAGE_HEIGHT - (Top Margin + Bottom Margin)
    const USABLE_PAGE_HEIGHT_PX = PAGE_HEIGHT_PX - (MARGIN_PX * 2);

    // Page Count = Total Content Height / Usable Height per Page
    const pageCount = Math.max(1, Math.ceil(contentHeight / USABLE_PAGE_HEIGHT_PX));

    const measureHeight = useCallback(() => {
        if (!editorRef.current) return { status: 'No EditorRef', pushed: 0 };

        const proseMirror = editorRef.current.querySelector('.ProseMirror');
        if (!proseMirror) return { status: 'No ProseMirror DOM', pushed: 0 };

        const children = Array.from(proseMirror.children) as HTMLElement[];

        // 1. Reset styles for clean measurement
        children.forEach((child) => {
            child.style.removeProperty('margin-top');
            child.style.removeProperty('padding-top');
            child.style.removeProperty('border-top');
            child.removeAttribute('data-pushed');
            child.removeAttribute('data-page');
        });

        // 2. Strict Layout Constants
        const PAGE_H = PAGE_HEIGHT_PX; // 1122.5px
        const GAP = GAP_HEIGHT_PX;     // 30px
        const TOP_MARGIN = MARGIN_PX;  // 96px
        const BOTTOM_MARGIN = MARGIN_PX; // 96px
        const FOOTER_BUFFER = 50;      // Extra buffer for footer (visual safety)

        // The "Safe Zone" where content is allowed to exist on a page
        // Relative to the Page Card Top: [TOP_MARGIN, PAGE_H - BOTTOM_MARGIN - FOOTER_BUFFER]
        const SAFE_CONTENT_HEIGHT = PAGE_H - TOP_MARGIN - BOTTOM_MARGIN - FOOTER_BUFFER;

        // 3. Layout Simulation State
        let pushedCount = 0;

        // Used to handle margin collapsing simulation
        let prevBottomMargin = 0;

        // ** RESET AND RE-RUN WITH ABSOLUTE TRACKING **
        // To implement this correctly, we simulate `simulatedY` starting at TOP_MARGIN.

        // Reset State
        let simulatedY = TOP_MARGIN; // Start at Top Margin of Page 0
        prevBottomMargin = 0;
        pushedCount = 0;

        const STRIDE = PAGE_H + GAP;

        children.forEach((child, index) => {
            const style = window.getComputedStyle(child);
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;

            // Get height (box-sizing border-box usually)
            const rect = child.getBoundingClientRect();
            const nodeHeight = rect.height;

            // Margin collapse
            const collapse = Math.max(prevBottomMargin, marginTop);

            // Proposed Position
            let nodeTop = simulatedY + collapse;
            let nodeBottom = nodeTop + nodeHeight;

            // Current Page Index based on Top
            const pageIndex = Math.floor(nodeTop / STRIDE);

            // Calculate Forbidden Zone for this page
            // Page Ends (Content Safe Zone) at:
            const pageSafeEnd = (pageIndex * STRIDE) + PAGE_H - BOTTOM_MARGIN - FOOTER_BUFFER;

            // Check Collision
            if (nodeBottom > pageSafeEnd) {
                // ** MOVE TO NEXT PAGE **

                // Target Start Y = Top Margin of (pageIndex + 1)
                const nextPageStartY = ((pageIndex + 1) * STRIDE) + TOP_MARGIN;

                // Calculate PUSH needed
                // We physically insert space to move `nodeTop` to `nextPageStartY`.
                const pushDelta = nextPageStartY - nodeTop;

                if (pushDelta > 0) {
                    child.style.paddingTop = `${pushDelta}px`;
                    child.setAttribute('data-pushed', 'true');
                    child.setAttribute('data-push-amount', `${Math.round(pushDelta)}`);
                    pushedCount++;

                    // Update Simulation
                    // Actual content now starts at `nextPageStartY`
                    // The `nodeBottom` moves by `pushDelta` (since box grew)
                    nodeBottom = nodeBottom + pushDelta;

                    // Resync simulatedY to match the new bottom
                    // (The bottom of this node is now the reference for the next)
                    simulatedY = nodeBottom;

                } else {
                    simulatedY = nodeBottom;
                }

            } else {
                // Determine page of start
                child.setAttribute('data-page', `${pageIndex}`);
                simulatedY = nodeBottom;
            }

            prevBottomMargin = marginBottom;
        });

        // Update container height
        setContentHeight(proseMirror.scrollHeight);
        console.log(`[Paginate] Run complete. Pushed: ${pushedCount}`);
        return { status: 'Success', children: children.length, pushed: pushedCount };
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Underline,
            Heading.configure({
                levels: [1, 2],
            }),
        ],
        content: `
      <h1>Legal Document Draft</h1>
      <p>This is a sample document to demonstrate the pagination capabilities. Start typing to see how the content flows across pages!</p>
      <p>The layout mimics a standard A4 page with 1-inch margins.</p>
      <p>Keep typing to see the content cross the page boundary. Ideally, we would want the text to jump the gap, but with a single editor instance and no node splitting, it will flow continuously over the gap. This is a trade-off for the "One Instance" architecture.</p>
    `,
        editorProps: {
            attributes: {
                class: "focus:outline-none min-h-[900px]",
            },
        },
        immediatelyRender: false,
    });

    // Attach Event Listeners Correctly
    useEffect(() => {
        if (!editor) return;

        const updateHandler = () => {
            // Defer slightly to ensure DOM is updated
            requestAnimationFrame(measureHeight);
        };

        editor.on('update', updateHandler);
        editor.on('selectionUpdate', updateHandler);

        // Also attach window debugger
        (window as any).measureHeight = measureHeight;

        // Initial Measure
        setTimeout(measureHeight, 100);

        return () => {
            editor.off('update', updateHandler);
            editor.off('selectionUpdate', updateHandler);
            delete (window as any).measureHeight;
        };
    }, [editor, measureHeight]);

    // Resize Observer
    useEffect(() => {
        if (!editorRef.current) return;
        const proseMirror = editorRef.current.querySelector('.ProseMirror');
        if (!proseMirror) return;

        const observer = new ResizeObserver(() => {
            measureHeight();
        });

        observer.observe(proseMirror);
        return () => observer.disconnect();
    }, [measureHeight]);

    return (
        <div className="flex flex-col h-screen bg-[#F3F4F6] overflow-hidden font-sans">
            <Toolbar editor={editor} />

            <div className="flex-1 overflow-auto p-8 flex justify-center relative bg-[#F9FAFB] cursor-text" onClick={() => editor?.commands.focus()}>
                <div className="relative" style={{ width: `${PAGE_WIDTH_PX}px` }}>

                    {/* Background Layer: Renders physical page cards */}
                    <div className="absolute top-0 left-0 w-full flex flex-col items-center pointer-events-none z-0" style={{ gap: `${GAP_HEIGHT_PX}px` }}>
                        {Array.from({ length: pageCount }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-200"
                                style={{
                                    width: '100%',
                                    height: `${PAGE_HEIGHT_PX}px`,
                                    position: 'relative'
                                }}
                            >
                                {/* Page Number Footer */}
                                <div className="absolute bottom-8 left-0 w-full text-center text-sm text-gray-500 font-medium select-none">
                                    Page {i + 1}
                                </div>

                            </div>
                        ))}
                    </div>

                    {/* Editor Layer: Continuous Overlay */}
                    <div
                        ref={editorRef}
                        className="relative z-10 min-h-screen"
                        style={{
                            // The text starts at the top margin of the first page
                            paddingTop: `${MARGIN_PX}px`,
                            paddingLeft: `${MARGIN_PX}px`,
                            paddingRight: `${MARGIN_PX}px`,
                            // We must ensure the text color is black
                        }}
                    >
                        {/* We use a Tailwind class to improve typography */}
                        {/* We add a specific ID for printing hacks if needed */}
                        <EditorContent
                            editor={editor}
                            className="prose prose-slate max-w-none focus:outline-none w-full text-black prose-p:leading-relaxed prose-headings:font-semibold prose-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Optional Status Bar */}
            <div className="bg-white border-t border-gray-200 p-2 text-xs flex justify-between px-6 text-gray-500 z-20">
                <span>Page {pageCount}</span>
                <span>Document Ready</span>
            </div>
        </div>
    );
};
