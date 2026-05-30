import { Card, Table } from "@agentscope-ai/design";
import { useTranslation } from "react-i18next";
import { formatCompact } from "../../../../utils/formatNumber";
import type { TokenUsageByUserRecord } from "../../../../api/types/tokenUsage";
import styles from "../index.module.less";

interface ByModelData {
  key: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  call_count: number;
}

interface ByDateData {
  key: string;
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  call_count: number;
}

interface DataTablesProps {
  byModelData: ByModelData[];
  byDateData: ByDateData[];
  byUserData?: TokenUsageByUserRecord[];
}

export function DataTables({
  byModelData,
  byDateData,
  byUserData,
}: DataTablesProps) {
  const { t } = useTranslation();

  const byUserColumns = [
    {
      title: t("tokenUsage.user", "用户"),
      dataIndex: "actor",
      key: "actor",
    },
    {
      title: t("tokenUsage.agent", "智能体"),
      dataIndex: "agent_id",
      key: "agent_id",
    },
    {
      title: t("tokenUsage.model"),
      dataIndex: "model",
      key: "model",
    },
    {
      title: t("tokenUsage.promptTokens"),
      dataIndex: "prompt_tokens",
      key: "prompt_tokens",
      render: (v: number) => formatCompact(v),
      sorter: (a: TokenUsageByUserRecord, b: TokenUsageByUserRecord) =>
        a.prompt_tokens - b.prompt_tokens,
    },
    {
      title: t("tokenUsage.completionTokens"),
      dataIndex: "completion_tokens",
      key: "completion_tokens",
      render: (v: number) => formatCompact(v),
      sorter: (a: TokenUsageByUserRecord, b: TokenUsageByUserRecord) =>
        a.completion_tokens - b.completion_tokens,
    },
    {
      title: t("tokenUsage.totalTokens"),
      key: "total_tokens",
      render: (_: unknown, record: TokenUsageByUserRecord) =>
        formatCompact(record.prompt_tokens + record.completion_tokens),
      sorter: (a: TokenUsageByUserRecord, b: TokenUsageByUserRecord) =>
        a.prompt_tokens +
        a.completion_tokens -
        (b.prompt_tokens + b.completion_tokens),
      defaultSortOrder: "descend" as const,
    },
    {
      title: t("tokenUsage.totalCalls"),
      dataIndex: "call_count",
      key: "call_count",
      render: (v: number) => formatCompact(v),
      sorter: (a: TokenUsageByUserRecord, b: TokenUsageByUserRecord) =>
        a.call_count - b.call_count,
    },
  ];

  const byModelColumns = [
    {
      title: t("tokenUsage.model"),
      dataIndex: "model",
      key: "model",
    },
    {
      title: t("tokenUsage.promptTokens"),
      dataIndex: "prompt_tokens",
      key: "prompt_tokens",
      render: (v: number) => formatCompact(v),
      sorter: (a: ByModelData, b: ByModelData) =>
        a.prompt_tokens - b.prompt_tokens,
    },
    {
      title: t("tokenUsage.completionTokens"),
      dataIndex: "completion_tokens",
      key: "completion_tokens",
      render: (v: number) => formatCompact(v),
      sorter: (a: ByModelData, b: ByModelData) =>
        a.completion_tokens - b.completion_tokens,
    },
    {
      title: t("tokenUsage.totalTokens"),
      key: "total_tokens",
      render: (_: unknown, record: ByModelData) =>
        formatCompact(record.prompt_tokens + record.completion_tokens),
      sorter: (a: ByModelData, b: ByModelData) =>
        a.prompt_tokens +
        a.completion_tokens -
        (b.prompt_tokens + b.completion_tokens),
    },
    {
      title: t("tokenUsage.totalCalls"),
      dataIndex: "call_count",
      key: "call_count",
      render: (v: number) => formatCompact(v),
      sorter: (a: ByModelData, b: ByModelData) => a.call_count - b.call_count,
    },
  ];

  const byDateColumns = [
    {
      title: t("tokenUsage.date"),
      dataIndex: "date",
      key: "date",
    },
    {
      title: t("tokenUsage.promptTokens"),
      dataIndex: "prompt_tokens",
      key: "prompt_tokens",
      render: (v: number) => formatCompact(v),
      sorter: (a: ByDateData, b: ByDateData) =>
        a.prompt_tokens - b.prompt_tokens,
    },
    {
      title: t("tokenUsage.completionTokens"),
      dataIndex: "completion_tokens",
      key: "completion_tokens",
      render: (v: number) => formatCompact(v),
      sorter: (a: ByDateData, b: ByDateData) =>
        a.completion_tokens - b.completion_tokens,
    },
    {
      title: t("tokenUsage.totalTokens"),
      key: "total_tokens",
      render: (_: unknown, record: ByDateData) =>
        formatCompact(record.prompt_tokens + record.completion_tokens),
      sorter: (a: ByDateData, b: ByDateData) =>
        a.prompt_tokens +
        a.completion_tokens -
        (b.prompt_tokens + b.completion_tokens),
    },
    {
      title: t("tokenUsage.totalCalls"),
      dataIndex: "call_count",
      key: "call_count",
      render: (v: number) => formatCompact(v),
      sorter: (a: ByDateData, b: ByDateData) => a.call_count - b.call_count,
    },
  ];

  return (
    <>
      {byUserData && byUserData.length > 0 && (
        <Card
          className={styles.tableCard}
          title={t("tokenUsage.byUser", "按用户统计")}
        >
          <Table
            columns={byUserColumns}
            dataSource={byUserData.map((r, i) => ({
              ...r,
              key: `${r.actor}:${r.agent_id}:${r.model}:${i}`,
            }))}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      )}

      {byModelData.length > 0 && (
        <Card className={styles.tableCard} title={t("tokenUsage.byModel")}>
          <Table
            columns={byModelColumns}
            dataSource={byModelData}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      )}

      {byDateData.length > 0 && (
        <Card className={styles.tableCard} title={t("tokenUsage.byDate")}>
          <Table
            columns={byDateColumns}
            dataSource={byDateData}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      )}
    </>
  );
}
