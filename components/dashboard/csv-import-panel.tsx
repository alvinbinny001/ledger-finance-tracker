'use client'

import { useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { FileUp } from 'lucide-react'
import { toast } from 'sonner'
import {
  importTransactions,
  previewImportedTransactions,
} from '@/app/actions/transactions'
import {
  categoriesForType,
  parseBankStatementCsv,
  type ImportedTransaction,
} from '@/lib/bank-csv'
import { formatMoney } from '@/lib/finance'
import { Button } from '@/components/ui/button'

type PreviewRow = {
  transaction: ImportedTransaction
  duplicate: boolean
  includeDuplicate: boolean
}

export function CsvImportPanel() {
  const router = useRouter()
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [rejected, setRejected] = useState<{ line: number; reason: string }[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    setRows([])
    setRejected([])
    setFileName('')
    setError(null)
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv') || file.size > 1_000_000) {
      setError('Choose a CSV file smaller than 1 MB.')
      input.value = ''
      return
    }

    setPending(true)
    try {
      const parsed = parseBankStatementCsv(await file.text())
      if (parsed.rows.length === 0) {
        setError('No valid transactions were found. Check the rejected rows below.')
        setRejected(parsed.rejected)
        setFileName(file.name)
        return
      }
      const duplicateIndexes = new Set(
        await previewImportedTransactions(parsed.rows),
      )
      setRows(
        parsed.rows.map((transaction, index) => ({
          transaction,
          duplicate: duplicateIndexes.has(index),
          includeDuplicate: false,
        })),
      )
      setRejected(parsed.rejected)
      setFileName(file.name)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The CSV could not be read.',
      )
    } finally {
      setPending(false)
      input.value = ''
    }
  }

  function updateCategory(index: number, category: string) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, transaction: { ...row.transaction, category } }
          : row,
      ),
    )
  }

  async function onImport() {
    setPending(true)
    setError(null)
    try {
      const candidates = rows
        .filter((row) => !row.duplicate || row.includeDuplicate)
        .map((row) => row.transaction)
      const includeDuplicateIndexes = rows.flatMap((row, index) =>
        row.duplicate && row.includeDuplicate
          ? [rows.slice(0, index).filter((previous) => !previous.duplicate || previous.includeDuplicate).length]
          : [],
      )
      const result = await importTransactions(candidates, includeDuplicateIndexes)
      toast.success(
        `Imported ${result.imported}; skipped ${result.duplicates} duplicate${result.duplicates === 1 ? '' : 's'}.`,
      )
      setRows([])
      setRejected([])
      setFileName('')
      router.refresh()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The transactions could not be imported.',
      )
    } finally {
      setPending(false)
    }
  }

  const importableCount = rows.filter((row) => !row.duplicate || row.includeDuplicate).length

  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-4">
        <h2 className="font-semibold">Import bank CSV</h2>
        <p className="text-sm text-muted-foreground">
          Review and categorize transactions before importing. The file is parsed in your browser and is not stored.
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center hover:bg-muted/40">
        <FileUp className="size-5 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium">
          {pending ? 'Reading and checking transactions…' : fileName || 'Choose a bank statement CSV'}
        </span>
        <span className="text-xs text-muted-foreground">
          CSV up to 1 MB · maximum 500 transactions
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={onFileChange}
          disabled={pending}
        />
      </label>

      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}

      {rejected.length > 0 && (
        <details className="mt-3 rounded-lg border p-3 text-sm">
          <summary className="cursor-pointer font-medium">
            {rejected.length} row{rejected.length === 1 ? '' : 's'} need attention
          </summary>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {rejected.slice(0, 20).map((row) => (
              <li key={row.line}>Line {row.line}: {row.reason}</li>
            ))}
            {rejected.length > 20 && <li>And {rejected.length - 20} more rejected rows.</li>}
          </ul>
        </details>
      )}

      {rows.length > 0 && (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            {rows.length} valid row{rows.length === 1 ? '' : 's'} previewed.
            {rows.some((row) => row.duplicate) &&
              ' Possible duplicates are excluded unless you mark them as distinct transactions.'}
          </p>
          <div className="mt-3 max-h-80 overflow-auto rounded-lg border">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Category (review)</th>
                  <th className="p-2">Import</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(({ transaction, duplicate }, index) => (
                  <tr key={`${transaction.occurredAt}-${index}`} className={duplicate ? 'opacity-50' : ''}>
                    <td className="whitespace-nowrap p-2">{transaction.occurredAt}</td>
                    <td className="max-w-48 truncate p-2" title={transaction.note}>
                      {transaction.note}
                      {duplicate && <span className="ml-1 text-xs text-amber-400">possible duplicate</span>}
                    </td>
                    <td className="p-2 capitalize">{transaction.type}</td>
                    <td className="whitespace-nowrap p-2">{formatMoney(transaction.amount)}</td>
                    <td className="p-2">
                      <select
                        aria-label={`Category for ${transaction.note}`}
                        value={transaction.category}
                        onChange={(event) => updateCategory(index, event.target.value)}
                        className="h-8 max-w-40 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {categoriesForType(transaction.type).map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      {duplicate ? (
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={rows[index].includeDuplicate}
                            onChange={(event) =>
                              setRows((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? { ...row, includeDuplicate: event.target.checked }
                                    : row,
                                ),
                              )
                            }
                          />
                          Distinct
                        </label>
                      ) : (
                        'Include'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            className="mt-4 w-full"
            disabled={pending || importableCount === 0}
            onClick={onImport}
          >
            {pending ? 'Importing…' : `Import ${importableCount} transaction${importableCount === 1 ? '' : 's'}`}
          </Button>
        </>
      )}
    </section>
  )
}
