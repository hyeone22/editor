/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WidgetType } from '../types/Widget';

const PLUGIN_NAME = 'widgetInsertMenu';
const COMMAND_PREFIX = 'widgetInsert';

export const WIDGET_INSERT_COMMANDS = {
  text: `${COMMAND_PREFIX}:text`,
  table: `${COMMAND_PREFIX}:table`,
  graph: `${COMMAND_PREFIX}:graph`,
  pageBreak: `${COMMAND_PREFIX}:pageBreak`,
} as const;

export type WidgetInsertCommand = (typeof WIDGET_INSERT_COMMANDS)[keyof typeof WIDGET_INSERT_COMMANDS];

interface TinyMcePluginManager {
  add: (name: string, callback: (editor: TinyMceEditor) => void) => void;
}

interface TinyMceMenuItem {
  type?: 'menuitem';
  text: string;
  icon?: string;
  onAction: () => void;
}

interface TinyMceUiRegistry {
  addMenuButton?: (
    name: string,
    config: {
      text?: string;
      tooltip?: string;
      icon?: string;
      fetch: (callback: (items: TinyMceMenuItem[]) => void) => void;
    },
  ) => void;
  addMenuItem?: (name: string, config: TinyMceMenuItem) => void;
}

interface TinyMceUndoManager {
  transact: (callback: () => void) => void;
}

interface TinyMceEditor {
  insertContent?: (content: string) => void;
  focus?: () => void;
  undoManager?: TinyMceUndoManager;
  addCommand?: (name: string, callback: () => void) => void;
  execCommand?: (name: string, ui?: boolean, value?: any) => void;
  ui?: { registry?: TinyMceUiRegistry };
}

interface TinyMceGlobal {
  PluginManager: TinyMcePluginManager;
}

type WidgetDataset = Record<string, string | number | boolean | null | undefined>;

interface WidgetInsertDefinition {
  type: Extract<WidgetType, 'text' | 'table' | 'graph' | 'pageBreak'>;
  title: string;
  menuLabel: string;
  description?: string;
  icon?: string;
  getConfig?: () => Record<string, unknown> | null;
  getDataset?: () => WidgetDataset | null;
}

let isRegistered = false;

const escapeAttributeValue = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const serialiseConfigForAttribute = (config: Record<string, unknown> | null | undefined): string | null => {
  if (!config) {
    return null;
  }

  try {
    return JSON.stringify(config).replace(/'/g, '&#39;').replace(/</g, '&lt;');
  } catch (error) {
    console.warn('[widgetInsertMenu] 위젯 설정 직렬화에 실패했습니다.', error);
    return null;
  }
};

const buildWidgetHtml = (definition: WidgetInsertDefinition): string => {
  const attributes: string[] = [`data-widget-type="${definition.type}"`, `data-widget-title="${escapeAttributeValue(definition.title)}"`];

  const serialisedConfig = serialiseConfigForAttribute(definition.getConfig?.() ?? null);
  if (serialisedConfig) {
    attributes.push(`data-widget-config='${serialisedConfig}'`);
  }

  const dataset = definition.getDataset?.();
  if (dataset) {
    Object.entries(dataset).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      attributes.push(`data-${key}="${escapeAttributeValue(String(value))}"`);
    });
  }

  return `<div ${attributes.join(' ')}></div>`;
};

const getWidgetDefinitions = (): WidgetInsertDefinition[] => [
  {
    type: 'text',
    title: '텍스트 블록',
    menuLabel: '텍스트 블록',
    description: '설명이나 해설을 입력할 수 있는 기본 텍스트 위젯입니다.',
    getConfig: () => ({
      content: '<p>새 텍스트 위젯 내용을 입력하세요.</p>',
      richText: true,
      style: { alignment: 'left', lineHeight: 1.6 },
    }),
  },
  {
    type: 'table',
    title: '테이블',
    menuLabel: '테이블',
    description: '지표와 값을 나열하는 표 위젯입니다.',
    getConfig: () => ({
      showHeader: true,
      responsive: true,
      columns: [
        { id: 'col-quarter', label: '분기', align: 'left', format: 'text' },
        { id: 'col-revenue', label: '매출 (USD)', align: 'right', format: 'currency' },
        { id: 'col-growth', label: '성장률', align: 'right', format: 'percent' },
      ],
      rows: [
        {
          id: 'row-q1',
          cells: [
            { columnId: 'col-quarter', value: '2024 Q1' },
            { columnId: 'col-revenue', value: 12500000 },
            { columnId: 'col-growth', value: 0.12 },
          ],
        },
        {
          id: 'row-q2',
          cells: [
            { columnId: 'col-quarter', value: '2024 Q2' },
            { columnId: 'col-revenue', value: 14800000 },
            { columnId: 'col-growth', value: 0.18 },
          ],
        },
      ],
      summary: [{ label: '연간 누적', value: '$27.3M', align: 'right' }],
      footnote: '※ 모든 수치는 미감사 자료 기준입니다.',
    }),
  },
  {
    type: 'graph',
    title: '그래프',
    menuLabel: '그래프',
    description: '분기별 추이를 한눈에 볼 수 있는 라인 차트 위젯입니다.',
    getConfig: () => ({
      chartType: 'line',
      labels: ['2023 Q1', '2023 Q2', '2023 Q3', '2023 Q4'],
      datasets: [
        {
          id: 'growth-actual',
          label: '실제 성장률',
          data: [12.5, 14.2, 16.1, 18.4],
          backgroundColor: 'rgba(59, 130, 246, 0.25)',
          borderColor: 'rgba(59, 130, 246, 1)',
          fill: true,
        },
        {
          id: 'growth-target',
          label: '목표 성장률',
          data: [11, 13, 15, 17],
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          fill: true,
        },
      ],
      options: {
        legend: true,
        showGrid: true,
        yAxisLabel: '%',
        xAxisLabel: '분기',
        precision: 1,
      },
    }),
  },
  {
    type: 'pageBreak',
    title: '페이지 나누기',
    menuLabel: '페이지 나누기',
    description: 'PDF 출력 시 수동으로 페이지를 나누는 구분선 위젯입니다.',
    getConfig: () => ({
      displayLabel: '페이지 나누기',
      keepWithNext: false,
      spacing: 'medium',
    }),
    getDataset: () => ({
      'page-break': 'true',
      'keep-with-next': 'false',
      spacing: 'medium',
    }),
  },
];

const registerCommands = (editor: TinyMceEditor, definitions: WidgetInsertDefinition[]) => {
  definitions.forEach((definition) => {
    const command = `${COMMAND_PREFIX}:${definition.type}`;
    editor.addCommand?.(command, () => {
      const html = buildWidgetHtml(definition);
      if (editor.undoManager?.transact) {
        editor.undoManager.transact(() => {
          editor.insertContent?.(html);
        });
      } else {
        editor.insertContent?.(html);
      }
      editor.focus?.();
    });
  });
};

const ensureWidgetInsertMenu = (tinyMCE: TinyMceGlobal | undefined) => {
  if (!tinyMCE || isRegistered) {
    return;
  }

  tinyMCE.PluginManager.add(PLUGIN_NAME, (editor: TinyMceEditor) => {
    const definitions = getWidgetDefinitions();

    registerCommands(editor, definitions);

    const insertWidget = (definition: WidgetInsertDefinition) => {
      const html = buildWidgetHtml(definition);
      const insert = () => {
        editor.insertContent?.(html);
        editor.focus?.();
      };

      if (editor.undoManager?.transact) {
        editor.undoManager.transact(insert);
      } else {
        insert();
      }
    };

    const createMenuItems = (): TinyMceMenuItem[] =>
      definitions.map((definition) => ({
        type: 'menuitem',
        text: definition.menuLabel,
        onAction: () => insertWidget(definition),
      }));

    if (editor.ui?.registry?.addMenuButton) {
      editor.ui.registry.addMenuButton('widgetInsertMenu', {
        text: '위젯 삽입',
        tooltip: '커스텀 위젯을 에디터에 삽입합니다',
        fetch: (callback) => {
          callback(createMenuItems());
        },
      });
    }
  });

  isRegistered = true;
};

export const ensureWidgetInsertMenuPlugin = ensureWidgetInsertMenu;

export default ensureWidgetInsertMenu;
