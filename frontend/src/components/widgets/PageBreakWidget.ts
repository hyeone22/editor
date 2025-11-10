import {
  serialiseWidgetConfig,
  widgetRendererRegistry,
  type WidgetRenderDescriptor,
} from '../../utils/widgetRenderer';
import type { PageBreakWidget } from '../../types/Widget';

type PageBreakSpacing = NonNullable<PageBreakWidget['spacing']>;

type PageBreakConfig = {
  displayLabel?: string;
  keepWithNext: boolean;
  spacing: PageBreakSpacing;
};

const DEFAULT_CONFIG: PageBreakConfig = {
  displayLabel: '페이지 나누기',
  keepWithNext: false,
  spacing: 'medium',
};

const PAGE_BREAK_SPACING_CLASS: Record<PageBreakSpacing, string> = {
  none: 'page-break-widget--spacing-none',
  small: 'page-break-widget--spacing-small',
  medium: 'page-break-widget--spacing-medium',
  large: 'page-break-widget--spacing-large',
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isSpacing = (value: unknown): value is PageBreakSpacing =>
  value === 'none' || value === 'small' || value === 'medium' || value === 'large';

const toPageBreakConfig = (descriptor: WidgetRenderDescriptor): PageBreakConfig => {
  const base: PageBreakConfig = { ...DEFAULT_CONFIG };
  const config = descriptor.config;

  if (!config || !isPlainObject(config)) {
    return base;
  }

  const displayLabel = config['displayLabel'];
  const keepWithNext = config['keepWithNext'];
  const spacing = config['spacing'];

  if (typeof displayLabel === 'string' && displayLabel.trim().length > 0) {
    base.displayLabel = displayLabel.trim();
  }

  if (typeof keepWithNext === 'boolean') {
    base.keepWithNext = keepWithNext;
  }

  if (isSpacing(spacing)) {
    base.spacing = spacing;
  }

  return base;
};

const updateElementConfig = (element: HTMLElement, config: PageBreakConfig) => {
  const payload: Record<string, unknown> = {};

  if (config.displayLabel) {
    payload.displayLabel = config.displayLabel;
  }

  if (config.keepWithNext) {
    payload.keepWithNext = config.keepWithNext;
  }

  if (config.spacing !== DEFAULT_CONFIG.spacing) {
    payload.spacing = config.spacing;
  }

  const serialised = serialiseWidgetConfig(payload);
  if (serialised) {
    element.setAttribute('data-widget-config', serialised);
  } else {
    element.removeAttribute('data-widget-config');
  }
};

const applyDataset = (element: HTMLElement, config: PageBreakConfig) => {
  element.setAttribute('data-page-break', 'true');
  element.setAttribute('data-keep-with-next', String(config.keepWithNext));
  element.setAttribute('data-spacing', config.spacing);

  if (config.displayLabel) {
    element.setAttribute('data-display-label', config.displayLabel);
  } else {
    element.removeAttribute('data-display-label');
  }
};

const renderPageBreakWidget = ({
  element,
  data,
}: {
  element: HTMLElement;
  data: WidgetRenderDescriptor;
}) => {
  const host = element;
  const config = toPageBreakConfig(data);

  host.innerHTML = '';
  host.classList.add('page-break-widget-host');
  host.setAttribute('role', 'separator');
  host.setAttribute('aria-label', `${config.displayLabel ?? '페이지 나누기'} 구분선`);

  const container = document.createElement('div');
  container.className = ['page-break-widget', PAGE_BREAK_SPACING_CLASS[config.spacing]]
    .filter(Boolean)
    .join(' ');

  const label = document.createElement('div');
  label.className = 'page-break-widget__label';
  label.textContent = config.displayLabel ?? data.title ?? '페이지 나누기';

  const description = document.createElement('div');
  description.className = 'page-break-widget__description';
  description.textContent = config.keepWithNext
    ? '다음 섹션과 같은 페이지에 유지'
    : '여기서 새 페이지가 시작됩니다';

  const rule = document.createElement('div');
  rule.className = 'page-break-widget__rule';

  container.append(label, description, rule);
  host.append(container);

  updateElementConfig(host, config);
  applyDataset(host, config);
};

widgetRendererRegistry.register('pageBreak', renderPageBreakWidget);

export default renderPageBreakWidget;
