import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TransactionType } from '@/lib/finance'

export type ImportedTransaction = {
  type: TransactionType
  amount: number
  category: string
  note: string
  occurredAt: string
}

type CsvData = { rows: ImportedTransaction[]; rejected: { line: number; reason: string }[] }

function readCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const character = text[i]
    if (quoted) {
      if (character === '"' && text[i + 1] === '"') {
        field += '"'
        i += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true
    } else if (character === ',') {
      row.push(field.trim())
      field = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[i + 1] === '\n') i += 1
      row.push(field.trim())
      if (row.some((cell) => cell.length > 0)) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (quoted) throw new Error('The CSV contains an unterminated quoted field.')
  row.push(field.trim())
  if (row.some((cell) => cell.length > 0)) rows.push(row)
  return rows
}

function normalizedHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findHeader(headers: string[], names: string[]) {
  return headers.findIndex((header) =>
    names.some((name) => header === name || header.startsWith(name)),
  )
}

function parseDate(value: string) {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(value)
  const namedMonth = /^(\d{1,2})[\s/-]([a-z]{3,9})[\s/-](\d{4})$/i.exec(value)
  let year: number
  let month: number
  let day: number

  if (iso) {
    year = Number(iso[1])
    month = Number(iso[2])
    day = Number(iso[3])
  } else if (namedMonth) {
    const months = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    ]
    day = Number(namedMonth[1])
    month = months.indexOf(namedMonth[2].slice(0, 3).toLowerCase()) + 1
    year = Number(namedMonth[3])
    if (month < 1) return null
  } else if (dmy) {
    day = Number(dmy[1])
    month = Number(dmy[2])
    year = Number(dmy[3])
    if (year < 100) year += year >= 70 ? 1900 : 2000
  } else {
    return null
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseAmount(value: string) {
  const cleaned = value.replace(/[₹$£€,\s]/g, '').replace(/[()]/g, (char) =>
    char === '(' ? '-' : '',
  )
  const amount = Number(cleaned)
  return Number.isFinite(amount) ? amount : null
}

function guessCategory(description: string, type: TransactionType) {
  const text = description.toLowerCase()
  if (type === 'income') {
    if (/salary|payroll|wages/.test(text)) return 'Salary'
    if (/freelance|consult/.test(text)) return 'Freelance'
    if (/interest|dividend|investment/.test(text)) return 'Investments'
    if (/gift|present/.test(text)) return 'Gifts'
    return 'Other Income'
  }
  if (/rent|landlord|mortgage|housing/.test(text)) return 'Housing'
  if (/grocery|market|restaurant|food|cafe|coffee|swiggy|zomato/.test(text)) return 'Food & Dining'
  if (/uber|ola|taxi|metro|bus|train|fuel|petrol|transport/.test(text)) return 'Transport'
  if (/amazon|shopping|store|retail/.test(text)) return 'Shopping'
  if (/electric|water|internet|mobile|utility|bill/.test(text)) return 'Bills & Utilities'
  if (/movie|cinema|netflix|spotify|entertainment/.test(text)) return 'Entertainment'
  if (/pharmacy|hospital|clinic|health|medical/.test(text)) return 'Health'
  if (/hotel|flight|travel|airline/.test(text)) return 'Travel'
  if (/school|college|course|education/.test(text)) return 'Education'
  return 'Other'
}

export function parseBankStatementCsv(text: string): CsvData {
  const rows = readCsv(text.replace(/^\uFEFF/, ''))
  if (rows.length < 2) throw new Error('The CSV must contain a header and at least one transaction.')

  const headers = rows[0].map(normalizedHeader)
  const dateIndex = findHeader(headers, [
    'date',
    'transactiondate',
    'transdate',
    'posteddate',
    'postingdate',
    'valuedate',
    'txndate',
  ])
  const descriptionIndex = findHeader(headers, [
    'description',
    'transactiondescription',
    'details',
    'narration',
    'particulars',
    'transactionparticulars',
    'merchant',
    'merchantname',
    'memo',
    'remarks',
    'transactiondetails',
  ])
  const amountIndex = findHeader(headers, ['amount', 'transactionamount', 'value'])
  const debitIndex = findHeader(headers, ['debit', 'debitamount', 'withdrawal', 'withdrawalamount'])
  const creditIndex = findHeader(headers, ['credit', 'creditamount', 'deposit', 'depositamount'])
  const typeIndex = findHeader(headers, ['type', 'transactiontype', 'drcr'])

  if (dateIndex < 0 || descriptionIndex < 0 || (amountIndex < 0 && debitIndex < 0 && creditIndex < 0)) {
    throw new Error(
      'Could not identify the CSV columns. Include Date, Description, and Amount, or Debit and Credit columns.',
    )
  }

  const parsed: CsvData = { rows: [], rejected: [] }
  for (let i = 1; i < rows.length; i += 1) {
    const cells = rows[i]
    const occurredAt = parseDate(cells[dateIndex] ?? '')
    const note = (cells[descriptionIndex] ?? '').trim().slice(0, 140)
    const debit = debitIndex >= 0 ? parseAmount(cells[debitIndex] ?? '') : null
    const credit = creditIndex >= 0 ? parseAmount(cells[creditIndex] ?? '') : null
    const rawAmount = amountIndex >= 0 ? parseAmount(cells[amountIndex] ?? '') : null
    const rawType = (typeIndex >= 0 ? cells[typeIndex] : '').toLowerCase()
    let type: TransactionType
    let amount: number | null

    if (debit !== null && debit !== 0 && !(credit !== null && credit !== 0)) {
      type = 'expense'
      amount = Math.abs(debit)
    } else if (credit !== null && credit !== 0 && !(debit !== null && debit !== 0)) {
      type = 'income'
      amount = Math.abs(credit)
    } else if (rawAmount !== null && rawAmount !== 0) {
      const isExpenseType = /debit|withdraw|expense|\bdr\b/.test(rawType)
      const isIncomeType = /credit|deposit|income|\bcr\b/.test(rawType)
      type = isExpenseType ? 'expense' : isIncomeType ? 'income' : rawAmount < 0 ? 'expense' : 'income'
      amount = Math.abs(rawAmount)
    } else {
      amount = null
      type = 'expense'
    }

    const line = i + 1
    if (!occurredAt) {
      parsed.rejected.push({ line, reason: 'Unrecognized or invalid date.' })
    } else if (amount === null || amount <= 0 || amount > 1_000_000_000) {
      parsed.rejected.push({ line, reason: 'Missing or invalid amount.' })
    } else if (!note) {
      parsed.rejected.push({ line, reason: 'Missing transaction description.' })
    } else {
      parsed.rows.push({
        type,
        amount: Math.round(amount * 100) / 100,
        category: guessCategory(note, type),
        note,
        occurredAt,
      })
    }
  }

  if (parsed.rows.length > 500) {
    throw new Error('Import up to 500 transactions at a time.')
  }
  return parsed
}

export function categoriesForType(type: TransactionType) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}
