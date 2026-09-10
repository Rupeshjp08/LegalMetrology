import { classNames } from '../../../utils/classNames'
import Button from '../../ui/Button/Button'
import './Pagination.css'

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null

  const goTo = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange?.(page)
    }
  }

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <nav
      className={classNames('pagination', className)}
      aria-label="Pagination"
    >
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => goTo(currentPage - 1)}
        aria-label="Previous page"
      >
        Prev
      </Button>

      {pages.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="pagination__ellipsis">
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            type="button"
            className={classNames(
              'pagination__page',
              page === currentPage && 'is-active',
            )}
            onClick={() => goTo(page)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ),
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => goTo(currentPage + 1)}
        aria-label="Next page"
      >
        Next
      </Button>
    </nav>
  )
}
