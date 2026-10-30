'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, PackageCheck, Truck } from 'lucide-react';
import { useOperationsData } from '@/hooks/useOperationsData';

type ReportType = 'orders' | 'delivery' | 'drivers';
type ReportRow = Record<string, string | number>;

interface GeneratedReport {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  rows: ReportRow[];
}

const reportOptions: { id: ReportType; title: string; description: string }[] = [
  { id: 'orders', title: 'Order register', description: 'Order status, client, priority, and declared value' },
  { id: 'delivery', title: 'Delivery summary', description: 'Delivery outcomes grouped by current order status' },
  { id: 'drivers', title: 'Driver performance', description: 'Completed, active, and assigned work by driver' },
];

function toLocalDateInput(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

const today = new Date();
const defaultTo = toLocalDateInput(today);
const defaultFrom = toLocalDateInput(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));

function toCsv(rows: ReportRow[]) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [headers.map(escapeCell).join(','), ...rows.map((row) => headers.map((header) => escapeCell(row[header] ?? '')).join(','))].join('\r\n');
}

function downloadReport(report: GeneratedReport) {
  const blob = new Blob([toCsv(report.rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${report.title.toLowerCase().replace(/ /g, '-')}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReportsPage() {
  const { orders, assignments, drivers, isLoading, error: dataError } = useOperationsData();
  const [reportType, setReportType] = useState<ReportType>('orders');
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [generated, setGenerated] = useState<GeneratedReport | null>(null);
  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const from = new Date(`${fromDate}T00:00:00`).getTime();
    const to = new Date(`${toDate}T23:59:59.999`).getTime();
    return orders.filter((order) => {
      const createdAt = new Date(order.created_at).getTime();
      return createdAt >= from && createdAt <= to;
    });
  }, [orders, fromDate, toDate]);

  const assignmentCounts = useMemo(() => {
    const from = new Date(`${fromDate}T00:00:00`).getTime();
    const to = new Date(`${toDate}T23:59:59.999`).getTime();
    return assignments.reduce<Record<string, { total: number; completed: number; active: number }>>(
      (counts, assignment) => {
        const assignedAt = new Date(assignment.assigned_at).getTime();
        if (assignedAt < from || assignedAt > to) return counts;

        const current = counts[assignment.personnel_id] ?? { total: 0, completed: 0, active: 0 };
        current.total += 1;
        if (assignment.status === 'completed') current.completed += 1;
        if (assignment.status === 'in_progress' || assignment.status === 'pending') current.active += 1;
        counts[assignment.personnel_id] = current;
        return counts;
      },
      {}
    );
  }, [assignments, fromDate, toDate]);

  const handleGenerate = () => {
    if (fromDate > toDate) {
      setError('Start date must be on or before end date.');
      return;
    }

    const rows: ReportRow[] = reportType === 'orders'
      ? filteredOrders.map((order) => ({
          order_number: order.order_number,
          client: order.client_name,
          status: order.status,
          priority: order.priority ?? 'normal',
          declared_value_inr: order.package_value ?? 0,
          created_at: new Date(order.created_at).toLocaleString('en-IN'),
        }))
      : reportType === 'delivery'
        ? Object.entries(filteredOrders.reduce<Record<string, number>>((counts, order) => {
            counts[order.status] = (counts[order.status] ?? 0) + 1;
            return counts;
          }, {})).map(([status, orderCount]) => ({ status, order_count: orderCount }))
        : drivers.map((driver) => {
            const counts = assignmentCounts[driver.id] ?? { total: 0, completed: 0, active: 0 };
            return {
              employee_id: driver.employee_id,
              vehicle_number: driver.vehicle_number,
              driver_status: driver.current_status,
              completed_assignments: counts.completed,
              active_assignments: counts.active,
              total_assignments: counts.total,
              completed_deliveries: driver.total_deliveries_completed,
            };
          });

    const report: GeneratedReport = {
      id: `${Date.now()}`,
      title: reportOptions.find((option) => option.id === reportType)?.title ?? 'Operations report',
      period: `${fromDate} to ${toDate}`,
      generatedAt: new Date().toLocaleString('en-IN'),
      rows,
    };

    setGenerated(report);
    setHistory((previous) => [report, ...previous].slice(0, 5));
    setError(rows.length === 0 ? 'No matching records were found for this date range.' : null);
  };

  const previewRows = generated?.rows.slice(0, 8) ?? [];
  const previewHeaders = previewRows[0] ? Object.keys(previewRows[0]) : [];

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Operations / Reports</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">Reports</h1>
            <p className="mt-2 text-sm text-muted-foreground">Build and export operational summaries.</p>
          </div>
          <span className="inline-flex min-h-8 w-fit items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success-foreground">
            Live records
          </span>
        </header>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section className="space-y-6">
            <div className="border-b border-border pb-5">
              <h2 className="text-lg font-semibold text-foreground">Report setup</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose a dataset and reporting period.</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Report type</span>
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value as ReportType)}
                className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
              >
                {reportOptions.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
              </select>
              <span className="mt-2 block text-xs text-muted-foreground">
                {reportOptions.find((option) => option.id === reportType)?.description}
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">From</span>
                <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [color-scheme:light] dark:[color-scheme:dark]" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">To</span>
                <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [color-scheme:light] dark:[color-scheme:dark]" />
              </label>
            </div>

            {(dataError || error) && <p role="alert" className="text-sm text-danger-foreground">{dataError || error}</p>}
            {isLoading && <p role="status" className="text-sm text-muted-foreground">Loading report data…</p>}

            <div className="flex flex-wrap gap-3">
              <button onClick={handleGenerate} disabled={isLoading} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <FileText className="h-4 w-4" /> Generate report
              </button>
              <button
                onClick={() => generated && downloadReport(generated)}
                disabled={!generated || generated.rows.length === 0}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </section>

          <section className="space-y-5">
            <div className="border-b border-border pb-5">
              <h2 className="text-lg font-semibold text-foreground">Report coverage</h2>
              <p className="mt-1 text-sm text-muted-foreground">Available operational datasets.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="flex items-center justify-between border-b border-border py-3">
                <span className="flex items-center gap-3 text-sm text-foreground"><FileText className="h-4 w-4 text-primary" />Orders in period</span>
                <span className="font-semibold tabular-nums text-foreground">{filteredOrders.length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-3">
                <span className="flex items-center gap-3 text-sm text-foreground"><PackageCheck className="h-4 w-4 text-success-foreground" />Delivered</span>
                <span className="font-semibold tabular-nums text-foreground">{filteredOrders.filter((order) => order.status === 'delivered').length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-3">
                <span className="flex items-center gap-3 text-sm text-foreground"><Truck className="h-4 w-4 text-warning-foreground" />Drivers</span>
                <span className="font-semibold tabular-nums text-foreground">{drivers.length}</span>
              </div>
            </div>
            <div className="border-l-2 border-warning-foreground pl-4 text-sm leading-6 text-muted-foreground">
              Reports are generated from the currently available records. Recent exports are kept in this browser session.
            </div>
          </section>
        </div>

        <section className="space-y-5 border-t border-border pt-7">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">{generated ? `${generated.title} · ${generated.period}` : 'Generate a report to preview its rows.'}</p>
            </div>
            {generated && <span className="text-xs text-muted-foreground">Generated {generated.generatedAt}</span>}
          </div>

          {generated && generated.rows.length > 0 ? (
            <div className="overflow-x-auto border-y border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>{previewHeaders.map((header) => <th key={header} className="whitespace-nowrap px-4 py-3 font-semibold">{header.replace(/_/g, ' ')}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewRows.map((row, index) => (
                    <tr key={`${generated.id}-${index}`}>
                      {previewHeaders.map((header) => <td key={header} className="whitespace-nowrap px-4 py-3 text-foreground">{row[header]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {generated.rows.length > previewRows.length && <p className="px-4 py-3 text-xs text-muted-foreground">Showing {previewRows.length} of {generated.rows.length} rows.</p>}
            </div>
          ) : (
              <div className="border-y border-border py-10 text-center text-sm text-muted-foreground">
                {generated ? 'No records found for this report period.' : 'No report preview yet.'}
              </div>
          )}
        </section>

        <section className="space-y-4 border-t border-border pt-7">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent exports</h2>
              <p className="mt-1 text-sm text-muted-foreground">Reports generated during this session.</p>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{history.length} / 5</span>
          </div>
          {history.length ? history.map((report) => (
            <div key={report.id} className="flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{report.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{report.period} · {report.rows.length} rows · {report.generatedAt}</p>
              </div>
              <button onClick={() => downloadReport(report)} aria-label={`Download ${report.title}`} title="Download CSV" className="inline-flex min-h-11 min-w-11 w-fit items-center gap-2 rounded-md p-2 text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Download className="h-4 w-4" /> <span className="text-xs">CSV</span>
              </button>
            </div>
          )) : (
            <p className="border-b border-border py-6 text-sm text-muted-foreground">No exports generated in this session.</p>
          )}
        </section>
      </div>
    </div>
  );
}