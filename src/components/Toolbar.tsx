import React from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Type } from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  // Force re-render on editor state changes to update button active states
  const [_, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => forceUpdate();

    editor.on('transaction', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);

    return () => {
      editor.off('transaction', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const toggleH1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run();
  const toggleH2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();

  const Button = ({ onClick, isActive, children, title }: { onClick: () => void, isActive: boolean, children: React.ReactNode, title: string }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent losing focus from editor
        onClick();
      }}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${isActive ? 'bg-black text-white hover:bg-gray-800' : 'text-gray-600'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm font-sans">
      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
        <Button onClick={toggleH1} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 size={18} />
        </Button>
        <Button onClick={toggleH2} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={18} />
        </Button>
      </div>

      <div className="w-[1px] h-8 bg-gray-300 mx-2" />

      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
        <Button onClick={toggleBold} isActive={editor.isActive('bold')} title="Bold">
          <Bold size={18} />
        </Button>
        <Button onClick={toggleItalic} isActive={editor.isActive('italic')} title="Italic">
          <Italic size={18} />
        </Button>
      </div>

      <div className="w-[1px] h-8 bg-gray-300 mx-2" />

      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
        <Button onClick={toggleBulletList} isActive={editor.isActive('bulletList')} title="Bullet List">
          <List size={18} />
        </Button>
        <Button onClick={toggleOrderedList} isActive={editor.isActive('orderedList')} title="Ordered List">
          <ListOrdered size={18} />
        </Button>
      </div>
    </div>
  );
};
