import type { WidgetType } from '../types/Widget';

export interface WidgetRenderDescriptor {
  id: string;
  type: WidgetType;
  title?: string;
  version?: string;
  order?: number;
  config: Record<string, unknown> | null;
  dataset: Record<string, string>;
}

export interface WidgetRenderArgs {
  element: HTMLElement;
  data: WidgetRenderDescriptor;
}

export type WidgetRenderer = (args: WidgetRenderArgs) => void;

export class WidgetRendererRegistry {
  private renderers = new Map<WidgetType, WidgetRenderer>();

  private fallbackRenderer: WidgetRenderer = ({ element, data }) => {
    element.innerHTML = [
      '<div class="widget-block__placeholder">',
      `<span class="widget-block__label">${data.title ?? '커스텀 위젯'}</span>`,
      `<span class="widget-block__type">${data.type}</span>`,
      '</div>',
    ].join('');
  };

  register(type: WidgetType, renderer: WidgetRenderer) {
    this.renderers.set(type, renderer);
  }

  unregister(type: WidgetType) {
    this.renderers.delete(type);
  }

  setFallback(renderer: WidgetRenderer) {
    this.fallbackRenderer = renderer;
  }

  render(args: WidgetRenderArgs) {
    const renderer = this.renderers.get(args.data.type) ?? this.fallbackRenderer;
    renderer(args);
  }
}

export const widgetRendererRegistry = new WidgetRendererRegistry();

export const parseWidgetConfig = (
  rawValue: string | null,
): Record<string, unknown> | null => {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.warn('위젯 설정을 파싱하지 못했습니다.', error);
    return null;
  }
};

export const serialiseWidgetConfig = (
  value: Record<string, unknown> | null | undefined,
): string | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('위젯 설정을 문자열로 직렬화하지 못했습니다.', error);
    return null;
  }
};
