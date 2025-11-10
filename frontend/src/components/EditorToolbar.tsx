import type { FC } from 'react';

type EditorStatus = 'loading' | 'ready' | 'error';

interface EditorToolbarProps {
  status: EditorStatus;
}

const AVAILABLE_WIDGETS: { type: string; label: string }[] = [
  { type: 'text', label: '텍스트' },
  { type: 'table', label: '테이블' },
  { type: 'graph', label: '그래프' },
  { type: 'pageBreak', label: '페이지 나누기' },
];

const EditorToolbar: FC<EditorToolbarProps> = ({ status }) => {
  const isReady = status === 'ready';

  return (
    <div className="editor-toolbar" role="status" aria-live="polite">
      <div className="editor-toolbar__heading">
        <span className="editor-toolbar__label">위젯 삽입</span>
        <span className="editor-toolbar__description">
          TinyMCE 툴바의 <strong>위젯 삽입</strong> 메뉴에서 원하는 위젯을 추가할 수 있습니다.
          {!isReady && ' 에디터가 준비되면 메뉴가 활성화됩니다.'}
        </span>
      </div>
      <div className="editor-toolbar__chips" aria-hidden="true">
        {AVAILABLE_WIDGETS.map((widget) => (
          <span key={widget.type} className="editor-toolbar__chip">
            {widget.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default EditorToolbar;
