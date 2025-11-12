// KCBChecklist.tsx
import React, { useEffect, useMemo, useState } from 'react';

type Item = {
  id: string;
  label: string;
  done: boolean;
  children?: Item[];
};

// === 새 요구사항을 반영한 체크리스트 트리 ===
const initialGroups: Item[] = [
  {
    id: 'layout-design',
    label: '레이아웃/디자인',
    done: false,
    children: [
      { id: 'img-insert-left', label: '그림 삽입, 크기 변경, 좌측 정렬', done: false },
      { id: 'spacing-adjust', label: '디자인 요소간 간격 조정', done: false },
      { id: 'title-center-style', label: '제목 삽입, 글꼴/ 스타일 변경/ 가운데 정렬', done: false },
      { id: 'company-overview-layout', label: '기업명 및 개요 레이아웃 배치', done: false },
    ],
  },
  {
    id: 'content-generation-placement',
    label: '본문 생성/배치',
    done: false,
    children: [
      {
        id: 'widget-create',
        label: '표, 그림(그래프), Text 위젯의 생성(삽입) 기능',
        done: false,
      },
      {
        id: 'widget-in-editor',
        label: '에디터 본문에 생성 기능 적용',
        done: false,
      },
      {
        id: 'layout-like-1-2-3',
        label: '그림 1,2,3과 같은 배치 가능 여부 확인',
        done: false,
      },
      {
        id: 'placement-adjust-demo',
        label: '배치 조정 기능 시연',
        done: false,
        children: [
          { id: 'order-change', label: '1,2,3 순서 변경', done: false },
          { id: 'size-change', label: '크기 조정', done: false },
          { id: 'position-change', label: '위치 조정', done: false },
        ],
      },
    ],
  },
  {
    id: 'template-editor-2',
    label: '시연용 Template 편집기 구현 (2)',
    done: false,
    children: [
      { id: 'page-margins', label: '페이지 여백 설정 (상, 하, 좌, 우)', done: false },
      { id: 'pdf-check', label: 'PDF 변환 결과 확인', done: false },
      { id: 'page-break-char', label: '페이지 나눔문자 적용 여부', done: false },
    ],
  },
];

const STORAGE_KEY = 'kcb-checklist-v2';

function flatten(items: Item[]): Item[] {
  const out: Item[] = [];
  const walk = (arr: Item[]) =>
    arr.forEach((i) => {
      out.push(i);
      if (i.children?.length) walk(i.children);
    });
  walk(items);
  return out;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default function KCBChecklist({
  title = 'KCB 프로젝트 PoC — 체크리스트',
}: {
  title?: string;
}) {
  const [groups, setGroups] = useState<Item[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as Item[];
      } catch {
        /* ignore */
      }
    }
    return deepClone(initialGroups);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  const allItems = useMemo(() => flatten(groups), [groups]);
  const leafItems = useMemo(
    () => allItems.filter((i) => !i.children || i.children.length === 0),
    [allItems],
  );
  const completed = leafItems.filter((i) => i.done).length;
  const progress = Math.round((completed / Math.max(leafItems.length, 1)) * 100);

  const toggle = (id: string) => {
    const next = deepClone(groups);

    const setById = (arr: Item[]): boolean => {
      for (const it of arr) {
        if (it.id === id && (!it.children || it.children.length === 0)) {
          it.done = !it.done;
          return true;
        }
        if (it.children && setById(it.children)) {
          const leaves = flatten([it]).filter((x) => !x.children || x.children.length === 0);
          it.done = leaves.length > 0 && leaves.every((l) => l.done);
          return true;
        }
      }
      return false;
    };

    // 그룹 체크박스 토글 시, 하위 전체 일괄 토글
    const toggleGroup = (arr: Item[]): boolean => {
      for (const it of arr) {
        if (it.id === id && it.children?.length) {
          const target = !it.done;
          const setDeep = (node: Item) => {
            node.done = target;
            node.children?.forEach(setDeep);
          };
          setDeep(it);
          return true;
        }
        if (it.children && toggleGroup(it.children)) {
          const leaves = flatten([it]).filter((x) => !x.children || x.children.length === 0);
          it.done = leaves.length > 0 && leaves.every((l) => l.done);
          return true;
        }
      }
      return false;
    };

    if (!setById(next)) toggleGroup(next);
    setGroups(next);
  };

  const resetAll = () => setGroups(deepClone(initialGroups));
  const completeAll = () => {
    const next = deepClone(groups);
    flatten(next).forEach((i) => (i.done = true));
    setGroups(next);
  };

  return (
    <main className="container">
      <section>
        <h1>KCB 프로젝트 PoC</h1>
        <p>
          이 화면은 <code>checklist.md</code>의 작업 항목을 실제 진행용 체크리스트로 구성한
          것입니다. 우측 말풍선/요구사항을 그룹별로 정리했고, 진행률/완료 표시를 제공합니다.
        </p>
      </section>

      <section className="status-card">
        <h2>{title}</h2>
        <div className="status-row">
          <span className="status-indicator">진행률 {progress}%</span>
          <div className="progress">
            <div className="bar" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="button-row">
          <button type="button" onClick={completeAll}>
            모두 완료
          </button>
          <button type="button" className="ghost" onClick={resetAll}>
            초기화
          </button>
        </div>

        <div className="checklist">
          {groups.map((group) => (
            <Group key={group.id} item={group} onToggle={toggle} />
          ))}
        </div>
      </section>

      <style>{css}</style>
    </main>
  );
}

function Group({ item, onToggle }: { item: Item; onToggle: (id: string) => void }) {
  const leaves = flatten([item]).filter((i) => !i.children || i.children.length === 0);
  const doneLeaves = leaves.filter((i) => i.done).length;
  const ratio = leaves.length > 0 ? `(${doneLeaves}/${leaves.length})` : item.done ? '(완료)' : '';

  return (
    <div className="group">
      <label className="row group-title">
        <input
          type="checkbox"
          checked={item.done}
          onChange={() => onToggle(item.id)}
          aria-label={`${item.label} 전체 토글`}
        />
        <span className="label">
          {item.label} <em className="muted">{ratio}</em>
        </span>
      </label>

      {item.children && (
        <div className="children">
          {item.children.map((child) =>
            child.children?.length ? (
              <Group key={child.id} item={child} onToggle={onToggle} />
            ) : (
              <label key={child.id} className="row leaf">
                <input type="checkbox" checked={child.done} onChange={() => onToggle(child.id)} />
                <span className="label">{child.label}</span>
              </label>
            ),
          )}
        </div>
      )}
    </div>
  );
}

const css = `
:root {
  --card-bg: #ffffff;
  --card-border: #e6e6e6;
  --text: #222;
  --muted: #6b7280;
  --primary: #ff5a1f; /* KCB 오렌지 느낌 */
  --primary-weak: rgba(255, 90, 31, 0.12);
  --ring: rgba(17, 24, 39, 0.08);
}

* { box-sizing: border-box; }
body { margin: 0; }

.container {
  max-width: 920px;
  margin: 32px auto;
  padding: 0 16px;
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
}

h1 { font-size: 24px; margin: 0 0 8px; }
h2 { font-size: 20px; margin: 0 0 12px; }
p  { line-height: 1.6; color: #333; }

.status-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 18px;
  margin-top: 16px;
  box-shadow: 0 1px 0 var(--ring), 0 8px 24px rgba(0,0,0,.03);
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 14px;
}

.status-indicator {
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--primary-weak);
  color: var(--primary);
}

.progress {
  flex: 1;
  height: 8px;
  background: #f1f3f5;
  border-radius: 999px;
  overflow: hidden;
}
.progress .bar {
  height: 100%;
  background: var(--primary);
  transition: width .2s ease;
}

.button-row {
  display: flex;
  gap: 8px;
  margin: 6px 0 14px;
}
button {
  appearance: none;
  border: 1px solid var(--card-border);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}
.checklist { display: grid; gap: 10px; }

.group {
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}
.group-title { font-weight: 700; }

.children { margin-left: 20px; margin-top: 8px; display: grid; gap: 8px; }

.row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.row input[type="checkbox"] {
  margin-top: 2px;
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
}
.label { line-height: 1.5; }
.leaf .label { font-weight: 500; }
.muted { color: var(--muted); font-style: normal; font-weight: 500; }
`;
