import { classNames } from '../../../utils/classNames'
import './Table.css'

/**
 * Accessible, responsive data table.
 *
 * columns: [
 *   { key, header, render?: (row) => node, align?: 'left'|'center'|'right' }
 * ]
 * rows: array of plain objects consumed by each column's renderer.
 */
export default function Table({
  columns,
  rows = [],
  caption,
  emptyMessage = 'No records found.',
  loading = false,
  className = '',
  dense = false,
}) {
  return (
    <div
      className={classNames(
        'table-wrapper',
        dense && 'table-wrapper--dense',
        className,
      )}
    >
      <table className="table">
        {caption && <caption className="table__caption">{caption}</caption>}
        <thead className="table__head">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={classNames(
                  column.align === 'right' && 'is-right',
                  column.align === 'center' && 'is-center',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table__body">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="table__state">
                <span className="table__spinner" aria-hidden="true" />
                Loading records…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table__state">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={row.id ?? rowIndex}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={classNames(
                      column.align === 'right' && 'is-right',
                      column.align === 'center' && 'is-center',
                    )}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}