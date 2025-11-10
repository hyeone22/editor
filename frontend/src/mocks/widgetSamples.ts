import {
  AiNarrativeWidget,
  AnyWidget,
  DesignAssetWidget,
  FieldWidget,
  GraphWidget,
  PageBreakWidget,
  SectionWidget,
  TableWidget,
  TextWidget,
} from '../types/Widget';

export const SAMPLE_TEXT_WIDGET: TextWidget = {
  id: 'widget-text-001',
  type: 'text',
  title: 'Executive Summary',
  order: 1,
  content:
    '<p>The company reported strong quarterly earnings with revenue growth across all major segments.</p>',
  richText: true,
  style: {
    alignment: 'left',
    fontSize: 16,
    lineHeight: 1.6,
    fontWeight: 'medium',
  },
};

export const SAMPLE_TABLE_WIDGET: TableWidget = {
  id: 'widget-table-001',
  type: 'table',
  title: 'Quarterly Revenue Breakdown',
  order: 2,
  showHeader: true,
  columns: [
    { id: 'col-quarter', label: 'Quarter', align: 'left', format: 'text' },
    { id: 'col-revenue', label: 'Revenue (USD)', align: 'right', format: 'currency' },
    { id: 'col-growth', label: 'Growth %', align: 'right', format: 'percent' },
  ],
  rows: [
    {
      id: 'row-q1',
      cells: [
        { columnId: 'col-quarter', value: 'Q1 2024' },
        { columnId: 'col-revenue', value: 12500000 },
        { columnId: 'col-growth', value: 0.12 },
      ],
    },
    {
      id: 'row-q2',
      cells: [
        { columnId: 'col-quarter', value: 'Q2 2024' },
        { columnId: 'col-revenue', value: 14800000 },
        { columnId: 'col-growth', value: 0.18 },
      ],
    },
  ],
  summary: [
    {
      label: 'Year-to-date',
      value: '$27.3M',
      align: 'right',
    },
  ],
};

export const SAMPLE_GRAPH_WIDGET: GraphWidget = {
  id: 'widget-graph-001',
  type: 'graph',
  title: 'Revenue Growth Trend',
  order: 3,
  chartType: 'line',
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [
    {
      id: 'ds-revenue',
      label: 'Revenue',
      data: [12.5, 14.8, 16.1, 17.4],
      backgroundColor: 'rgba(54, 162, 235, 0.3)',
      borderColor: 'rgba(54, 162, 235, 1)',
      fill: true,
    },
  ],
  options: {
    stacked: false,
    legend: true,
    yAxisLabel: 'Millions USD',
    showGrid: true,
  },
};

export const SAMPLE_SECTION_WIDGET: SectionWidget = {
  id: 'widget-section-001',
  type: 'section',
  title: 'Financial Overview',
  order: 0,
  layout: 'single-column',
  description: 'Highlights of the current fiscal year performance.',
  children: ['widget-text-001', 'widget-table-001', 'widget-graph-001'],
  theme: {
    backgroundColor: '#f5f7fa',
    borderColor: '#d7dde8',
    borderStyle: 'solid',
    padding: 24,
  },
};

export const SAMPLE_FIELD_WIDGET: FieldWidget = {
  id: 'widget-field-001',
  type: 'field',
  title: 'Report Title',
  order: 4,
  fieldId: 'report.title',
  valueType: 'string',
  placeholder: 'Enter report title',
  required: true,
};

export const SAMPLE_AI_WIDGET: AiNarrativeWidget = {
  id: 'widget-ai-001',
  type: 'aiNarrative',
  title: 'AI Commentary',
  order: 5,
  promptTemplate:
    'Analyze the revenue trend for {{companyName}} and highlight notable quarter-over-quarter changes.',
  tone: 'analytical',
  variables: [
    { key: 'companyName', label: 'Company Name', required: true },
    { key: 'metric', label: 'Metric', sampleValue: 'Revenue' },
  ],
};

export const SAMPLE_DESIGN_ASSET_WIDGET: DesignAssetWidget = {
  id: 'widget-asset-001',
  type: 'designAsset',
  title: 'Company Logo',
  order: 6,
  assetType: 'logo',
  url: 'https://example.com/assets/logo.svg',
  altText: 'Company logo',
  width: 160,
  height: 32,
};

export const SAMPLE_PAGE_BREAK_WIDGET: PageBreakWidget = {
  id: 'widget-pagebreak-001',
  type: 'pageBreak',
  title: 'Page Break',
  order: 7,
  displayLabel: 'Section 2',
  spacing: 'medium',
};

export const SAMPLE_WIDGETS: AnyWidget[] = [
  SAMPLE_SECTION_WIDGET,
  SAMPLE_TEXT_WIDGET,
  SAMPLE_TABLE_WIDGET,
  SAMPLE_GRAPH_WIDGET,
  SAMPLE_FIELD_WIDGET,
  SAMPLE_AI_WIDGET,
  SAMPLE_DESIGN_ASSET_WIDGET,
  SAMPLE_PAGE_BREAK_WIDGET,
];
