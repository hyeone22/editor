import { parseWidgetConfig, serialiseWidgetConfig } from '../utils/widgetRenderer';

interface TinyMceEditor {
  getBody?: () => HTMLElement | null;
  on?: (eventName: string, callback: (...args: unknown[]) => void) => void;
  off?: (eventName: string, callback: (...args: unknown[]) => void) => void;
  fire?: (eventName: string, data?: Record<string, unknown>) => void;
  setDirty?: (state: boolean) => void;
  nodeChanged?: () => void;
}

export interface WidgetResizeOptions {
  widgetSelector?: string;
  handleClassName?: string;
  resizingClassName?: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

const DEFAULT_WIDGET_SELECTOR = '[data-widget-type]';
const DEFAULT_HANDLE_CLASSNAME = 'widget-resize-handle';
const DEFAULT_RESIZING_CLASSNAME = 'widget-block--resizing';
const DEFAULT_MIN_WIDTH = 240;
const DEFAULT_MIN_HEIGHT = 160;
const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_MAX_HEIGHT = 900;

type Cleanup = () => void;

interface ResizeRecord {
  widget: HTMLElement;
  handle: HTMLElement;
  onPointerDown: (event: PointerEvent) => void;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const clampDimension = (value: number, min: number, max: number) => {
  const safeMax = Number.isFinite(max) ? max : Number.POSITIVE_INFINITY;
  return Math.min(Math.max(value, min), safeMax);
};

const toPixelValue = (value: number) => `${Math.round(value)}px`;

const extractDimension = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d+(?:\.\d+)?)px$/i);
    if (match) {
      return Number.parseFloat(match[1]);
    }
  }

  return null;
};

const applyInlineSize = (widget: HTMLElement, width: number, height: number) => {
  widget.style.width = toPixelValue(width);
  widget.style.height = toPixelValue(height);
};

const syncSizeFromConfig = (widget: HTMLElement) => {
  const config = parseWidgetConfig(widget.getAttribute('data-widget-config'));
  if (!config) {
    widget.style.width = '';
    widget.style.height = '';
    return;
  }

  const styleConfig = (config as { style?: unknown }).style;
  if (!isPlainObject(styleConfig)) {
    widget.style.width = '';
    widget.style.height = '';
    return;
  }

  const width = extractDimension(styleConfig.width);
  const height = extractDimension(styleConfig.height);

  widget.style.width = typeof width === 'number' ? toPixelValue(width) : '';
  widget.style.height = typeof height === 'number' ? toPixelValue(height) : '';
};

const commitSizeToConfig = (
  widget: HTMLElement,
  editor: TinyMceEditor,
  width: number,
  height: number,
) => {
  const config = parseWidgetConfig(widget.getAttribute('data-widget-config')) ?? {};
  const nextConfig: Record<string, unknown> = { ...config };
  const styleConfig = isPlainObject((nextConfig as { style?: unknown }).style)
    ? { ...((nextConfig as { style?: Record<string, unknown> }).style ?? {}) }
    : {};

  styleConfig.width = Math.round(width);
  styleConfig.height = Math.round(height);
  nextConfig.style = styleConfig;

  const serialised = serialiseWidgetConfig(nextConfig);
  if (serialised) {
    widget.setAttribute('data-widget-config', serialised);
  }

  applyInlineSize(widget, width, height);
  widget.dispatchEvent(new CustomEvent('widget:changed', { bubbles: true }));
  editor.fire?.('change');
  editor.setDirty?.(true);
  editor.nodeChanged?.();
};

export const attachWidgetResize = (
  editor: TinyMceEditor,
  options: WidgetResizeOptions = {},
): Cleanup => {
  const {
    widgetSelector = DEFAULT_WIDGET_SELECTOR,
    handleClassName = DEFAULT_HANDLE_CLASSNAME,
    resizingClassName = DEFAULT_RESIZING_CLASSNAME,
    minWidth = DEFAULT_MIN_WIDTH,
    minHeight = DEFAULT_MIN_HEIGHT,
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
  } = options;

  const records = new Map<HTMLElement, ResizeRecord>();

  const ensureWidgetHandle = (widget: HTMLElement) => {
    const existing = records.get(widget);
    if (existing) {
      if (!widget.contains(existing.handle)) {
        widget.appendChild(existing.handle);
      }
      return;
    }

    const handle = widget.querySelector<HTMLElement>(`.${handleClassName}`) ?? document.createElement('span');
    handle.classList.add(handleClassName);
    handle.setAttribute('role', 'presentation');
    handle.setAttribute('aria-hidden', 'true');
    handle.tabIndex = -1;

    const startResize = (event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const doc = widget.ownerDocument ?? document;
      const pointerId = event.pointerId;
      handle.setPointerCapture?.(pointerId);

      const rect = widget.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const originalWidth = rect.width;
      const originalHeight = rect.height;
      const minWidthLimit = Math.min(minWidth, originalWidth);
      const minHeightLimit = Math.min(minHeight, originalHeight);
      const maxWidthLimit = Number.isFinite(maxWidth)
        ? Math.max(maxWidth, originalWidth)
        : Number.POSITIVE_INFINITY;
      const maxHeightLimit = Number.isFinite(maxHeight)
        ? Math.max(maxHeight, originalHeight)
        : Number.POSITIVE_INFINITY;
      const clampWidth = (value: number) => clampDimension(value, minWidthLimit, maxWidthLimit);
      const clampHeight = (value: number) => clampDimension(value, minHeightLimit, maxHeightLimit);
      let latestWidth = originalWidth;
      let latestHeight = originalHeight;

      const previousDraggable = widget.getAttribute('draggable');
      widget.setAttribute('draggable', 'false');
      widget.classList.add(resizingClassName);

      const updateSize = (clientX: number, clientY: number) => {
        latestWidth = clampWidth(originalWidth + (clientX - startX));
        latestHeight = clampHeight(originalHeight + (clientY - startY));
        applyInlineSize(widget, latestWidth, latestHeight);
      };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        updateSize(moveEvent.clientX, moveEvent.clientY);
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        updateSize(upEvent.clientX, upEvent.clientY);

        handle.releasePointerCapture?.(pointerId);
        doc.removeEventListener('pointermove', handlePointerMove);
        doc.removeEventListener('pointerup', handlePointerUp);

        widget.classList.remove(resizingClassName);

        if (previousDraggable === null) {
          widget.removeAttribute('draggable');
        } else {
          widget.setAttribute('draggable', previousDraggable);
        }

        const widthChanged = Math.abs(latestWidth - originalWidth) > 0.5;
        const heightChanged = Math.abs(latestHeight - originalHeight) > 0.5;
        if (widthChanged || heightChanged) {
          commitSizeToConfig(widget, editor, latestWidth, latestHeight);
        }
      };

      doc.addEventListener('pointermove', handlePointerMove);
      doc.addEventListener('pointerup', handlePointerUp, { once: false });
    };

    handle.addEventListener('pointerdown', startResize);

    if (!widget.contains(handle)) {
      widget.appendChild(handle);
    }

    records.set(widget, { widget, handle, onPointerDown: startResize });
  };

  const ensureHandles = () => {
    const body = editor.getBody?.();
    if (!body) {
      return;
    }

    const widgets = Array.from(body.querySelectorAll<HTMLElement>(widgetSelector));
    const activeWidgets = new Set(widgets);

    widgets.forEach((widget) => {
      ensureWidgetHandle(widget);
      syncSizeFromConfig(widget);
    });

    Array.from(records.entries()).forEach(([widget, record]) => {
      if (!activeWidgets.has(widget) || !body.contains(widget)) {
        record.handle.removeEventListener('pointerdown', record.onPointerDown);
        record.handle.remove();
        records.delete(widget);
      }
    });
  };

  editor.on?.('init', ensureHandles);
  editor.on?.('SetContent', ensureHandles);
  editor.on?.('NodeChange', ensureHandles);

  const cleanup = () => {
    records.forEach((record) => {
      record.handle.removeEventListener('pointerdown', record.onPointerDown);
      record.handle.remove();
    });
    records.clear();

    if (editor.off) {
      editor.off('init', ensureHandles);
      editor.off('SetContent', ensureHandles);
      editor.off('NodeChange', ensureHandles);
    }
  };

  editor.on?.('remove', cleanup);

  return cleanup;
};

export default attachWidgetResize;
