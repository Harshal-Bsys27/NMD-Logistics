'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, PackageCheck, Truck } from 'lucide-react';
import { mockAssignments, mockDrivers, mockOrders } from '@/services/mockData';

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
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('orders');
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [generated, setGenerated] = useState<GeneratedReport | null>(null);
  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const from = new Date(`${fromDate}T00:00:00`).getTime();
    const to = new Date(`${toDate}T23:59:59.999`).getTime();
    return mockOrders.filter((order) => {
      const createdAt = new Date(order.created_at).getTime();
      return createdAt >= from && createdAt <= to;
    });
  }, [fromDate, toDate]);

  const assignmentCounts = useMemo(() => {
    const from = new Date(`${fromDate}T00:00:00`).getTime();
    const to = new Date(`${toDate}T23:59:59.999`).getTime();
    return mockAssignments.reduce<Record<string, { total: number; completed: number; active: number }>>(
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
  }, [fromDate, toDate]);

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
        : mockDrivers.map((driver) => {
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
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Operations / Reports</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Reports</h1>
            <p className="mt-2 text-sm text-slate-400">Build and export operational summaries.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-200">
            Sample records
          </span>
        </header>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section className="space-y-6">
            <div className="border-b border-slate-800 pb-5">
              <h2 className="text-lg font-semibold text-white">Report setup</h2>
              <p className="mt-1 text-sm text-slate-400">Choose a dataset and reporting period.</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Report type</span>
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value as ReportType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                {reportOptions.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
              </select>
              <span className="mt-2 block text-xs text-slate-500">
                {reportOptions.find((option) => option.id === reportType)?.description}
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">From</span>
                <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white [color-scheme:dark]" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">To</span>
                <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white [color-scheme:dark]" />
              </label>
            </div>

            {error && <p role="status" className="text-sm text-amber-300">{error}</p>}

            <div className="flex flex-wrap gap-3">
              <button onClick={handleGenerate} className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                <FileText className="h-4 w-4" /> Generate report
              </button>
              <button
                onClick={() => generated && downloadReport(generated)}
                disabled={!generated || generated.rows.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </section>

          <section className="space-y-5">
            <div className="border-b border-slate-800 pb-5">
              <h2 className="text-lg font-semibold text-white">Report coverage</h2>
              <p className="mt-1 text-sm text-slate-400">Available operational datasets.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="flex items-center justify-between border-b border-slate-800 py-3">
                <span className="flex items-center gap-3 text-sm text-slate-300"><FileText className="h-4 w-4 text-cyan-300" />Orders in period</span>
                <span className="font-semibold text-white">{filteredOrders.length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 py-3">
                <span className="flex items-center gap-3 text-sm text-slate-300"><PackageCheck className="h-4 w-4 text-emerald-300" />Delivered</span>
                <span className="font-semibold text-white">{filteredOrders.filter((order) => order.status === 'delivered').length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 py-3">
                <span className="flex items-center gap-3 text-sm text-slate-300"><Truck className="h-4 w-4 text-amber-300" />Drivers</span>
                <span className="font-semibold text-white">{mockDrivers.length}</span>
              </div>
            </div>
            <div className="border-l-2 border-amber-400/70 pl-4 text-sm leading-6 text-slate-400">
              Generated reports use the project’s sample records and are kept in this browser session only.
            </div>
          </section>
        </div>

        <section className="space-y-5 border-t border-slate-800 pt-7">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold text-white">Preview</h2>
              <p className="mt-1 text-sm text-slate-400">{generated ? `${generated.title} · ${generated.period}` : 'Generate a report to preview its rows.'}</p>
            </div>
            {generated && <span className="text-xs text-slate-500">Generated {generated.generatedAt}</span>}
          </div>

          {generated && generated.rows.length > 0 ? (
            <div className="overflow-x-auto border-y border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>{previewHeaders.map((header) => <th key={header} className="whitespace-nowrap px-4 py-3 font-semibold">{header.replace(/_/g, ' ')}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {previewRows.map((row, index) => (
                    <tr key={`${generated.id}-${index}`}>
                      {previewHeaders.map((header) => <td key={header} className="whitespace-nowrap px-4 py-3 text-slate-300">{row[header]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {generated.rows.length > previewRows.length && <p className="px-4 py-3 text-xs text-slate-500">Showing {previewRows.length} of {generated.rows.length} rows.</p>}
            </div>
          ) : (
              <div className="border-y border-slate-800 py-10 text-center text-sm text-slate-500">
                {generated ? 'No records found for this report period.' : 'No report preview yet.'}
              </div>
          )}
        </section>

        <section className="space-y-4 border-t border-slate-800 pt-7">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent exports</h2>
              <p className="mt-1 text-sm text-slate-400">Reports generated during this session.</p>
            </div>
            <span className="text-xs text-slate-500">{history.length} / 5</span>
          </div>
          {history.length ? history.map((report) => (
            <div key={report.id} className="flex flex-col gap-3 border-b border-slate-800 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white">{report.title}</p>
                <p className="mt-1 text-xs text-slate-500">{report.period} · {report.rows.length} rows · {report.generatedAt}</p>
              </div>
              <button onClick={() => downloadReport(report)} aria-label={`Download ${report.title}`} title="Download CSV" className="inline-flex w-fit items-center gap-2 rounded-md p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white">
                <Download className="h-4 w-4" /> <span className="text-xs">CSV</span>
              </button>
            </div>
          )) : (
            <p className="border-b border-slate-800 py-6 text-sm text-slate-500">No exports generated in this session.</p>
          )}
        </section>
      </div>
    </div>
  );
}