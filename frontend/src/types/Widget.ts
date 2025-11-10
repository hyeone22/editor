export type WidgetType =
  | 'text'
  | 'table'
  | 'graph'
  | 'pageBreak'
  | 'section'
  | 'field'
  | 'aiNarrative'
  | 'designAsset';

export type DataSourceType = 'static' | 'sql' | 'api';

export interface StaticDataSource {
  type: 'static';
  description?: string;
}

export interface SqlDataSource {
  type: 'sql';
  queryId: string;
  parameters?: Record<string, string | number | boolean | null>;
  connectionId?: string;
}

export interface ApiDataSource {
  type: 'api';
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  payload?: Record<string, unknown>;
}

export type DataSourceReference = StaticDataSource | SqlDataSource | ApiDataSource;

export interface WidgetMeta {
  createdAt: string;
  updatedAt: string;
  authorId?: string;
  tags?: string[];
  notes?: string;
}

export interface WidgetBase<TType extends WidgetType> {
  id: string;
  type: TType;
  title?: string;
  order: number;
  isLocked?: boolean;
  meta?: Partial<WidgetMeta>;
  dataSource?: DataSourceReference | null;
}

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type FontWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold';

export interface TextWidgetStyle {
  alignment?: TextAlignment;
  fontSize?: number;
  color?: string;
  fontWeight?: FontWeight;
  lineHeight?: number;
  letterSpacing?: number;
  backgroundColor?: string;
}

export interface TextWidget extends WidgetBase<'text'> {
  content: string;
  richText?: boolean;
  style?: TextWidgetStyle;
}

export type TableCellAlignment = 'left' | 'center' | 'right';

export type TableValueFormat =
  | 'text'
  | 'currency'
  | 'percent'
  | 'number'
  | 'date'
  | 'rating';

export interface TableColumnConfig {
  id: string;
  label: string;
  width?: number;
  align?: TableCellAlignment;
  format?: TableValueFormat;
  emphasis?: 'primary' | 'secondary' | 'muted';
}

export interface TableCellData {
  columnId: string;
  value: string | number | boolean | null;
  colspan?: number;
  rowspan?: number;
  emphasis?: 'positive' | 'negative' | 'neutral';
  tooltip?: string;
}

export interface TableRowData {
  id: string;
  cells: TableCellData[];
  expandableContent?: string;
}

export interface TableSummaryRow {
  label: string;
  value: string | number;
  align?: TableCellAlignment;
}

export interface TableWidget extends WidgetBase<'table'> {
  columns: TableColumnConfig[];
  rows: TableRowData[];
  showHeader?: boolean;
  summary?: TableSummaryRow[];
  footnote?: string;
  responsive?: boolean;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';

export interface ChartDataset {
  id: string;
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  fill?: boolean;
}

export interface GraphWidgetOptions {
  stacked?: boolean;
  legend?: boolean;
  showGrid?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  precision?: number;
}

export interface GraphWidget extends WidgetBase<'graph'> {
  chartType: ChartType;
  labels: string[];
  datasets: ChartDataset[];
  options?: GraphWidgetOptions;
}

export interface PageBreakWidget extends WidgetBase<'pageBreak'> {
  displayLabel?: string;
  keepWithNext?: boolean;
  spacing?: 'none' | 'small' | 'medium' | 'large';
}

export type SectionLayout = 'single-column' | 'two-column' | 'cover';

export interface SectionTheme {
  backgroundColor?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'none';
  padding?: number;
}

export interface SectionWidget extends WidgetBase<'section'> {
  layout: SectionLayout;
  description?: string;
  children: string[];
  theme?: SectionTheme;
}

export type FieldValueType = 'string' | 'number' | 'date' | 'richText' | 'boolean';

export interface FieldWidget extends WidgetBase<'field'> {
  fieldId: string;
  valueType: FieldValueType;
  placeholder?: string;
  format?: string;
  required?: boolean;
  helperText?: string;
}

export type AiNarrativeTone = 'formal' | 'casual' | 'analytical' | 'optimistic' | 'cautious';

export interface AiNarrativeVariable {
  key: string;
  label: string;
  sampleValue?: string;
  required?: boolean;
}

export interface AiNarrativeWidget extends WidgetBase<'aiNarrative'> {
  promptTemplate: string;
  variables: AiNarrativeVariable[];
  lastGeneratedText?: string;
  tone?: AiNarrativeTone;
  autoRefresh?: boolean;
}

export type DesignAssetType = 'image' | 'icon' | 'logo' | 'background';

export interface DesignAssetWidget extends WidgetBase<'designAsset'> {
  assetType: DesignAssetType;
  url: string;
  altText?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export type AnyWidget =
  | TextWidget
  | TableWidget
  | GraphWidget
  | PageBreakWidget
  | SectionWidget
  | FieldWidget
  | AiNarrativeWidget
  | DesignAssetWidget;

export type WidgetDictionary = Record<string, AnyWidget>;

export type WidgetLibrary = {
  [K in WidgetType]: Extract<AnyWidget, { type: K }>;
};
