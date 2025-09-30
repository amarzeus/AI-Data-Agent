import React, { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material'
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Sort as SortIcon
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { TableData } from '../../types'

interface DataTableProps {
  data: TableData
  height?: number
  showPagination?: boolean
  showSearch?: boolean
  showExport?: boolean
  title?: string
}

interface Column {
  key: string
  title: string
  type?: 'string' | 'number' | 'date' | 'boolean'
  sortable?: boolean
  filterable?: boolean
  width?: number
}

type Order = 'asc' | 'desc'

const DataTable: React.FC<DataTableProps> = ({
  data,
  height = 400,
  showPagination = true,
  showSearch = true,
  showExport = true,
  title = 'Data Table'
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [order, setOrder] = useState<Order>('asc')
  const [orderBy, setOrderBy] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Convert TableData to internal format
  const columns: Column[] = useMemo(() => {
    return data.columns.map(col => ({
      key: col.key,
      title: col.title,
      type: col.type as 'string' | 'number' | 'date' | 'boolean' || 'string',
      sortable: true,
      filterable: true
    }))
  }, [data.columns])

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.data

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply sorting
    if (orderBy) {
      filtered.sort((a, b) => {
        const aValue = a[orderBy]
        const bValue = b[orderBy]

        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        const comparison = String(aValue).localeCompare(String(bValue))
        return order === 'desc' ? -comparison : comparison
      })
    }

    return filtered
  }, [data.data, searchTerm, order, orderBy])

  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredAndSortedData

    const startIndex = page * rowsPerPage
    return filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredAndSortedData, page, rowsPerPage, showPagination])

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setPage(0)
  }


  const formatCellValue = (value: any, type?: string) => {
    if (value === null || value === undefined) return '-'

    switch (type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value)
      case 'date':
        return new Date(value).toLocaleDateString()
      case 'boolean':
        return value ? '✓' : '✗'
      default:
        return String(value)
    }
  }

  const exportToCSV = () => {
    const headers = columns.map(col => col.title).join(',')
    const rows = filteredAndSortedData.map(row =>
      columns.map(col => formatCellValue(row[col.key], col.type))
    )

    const csvContent = [headers, ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div
      className="data-table-container"
      style={{
        height,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Table Header */}
      <div className="table-header">
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>

        <div className="table-actions">
          {showSearch && (
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 200 }}
            />
          )}

          {showExport && (
            <Tooltip title="Export to CSV">
              <IconButton onClick={exportToCSV} size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  sortDirection={orderBy === column.key ? order : false}
                  sx={{
                    backgroundColor: 'background.paper',
                    fontWeight: 600,
                    minWidth: column.width || 120
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.key}
                      direction={orderBy === column.key ? order : 'asc'}
                      onClick={() => handleRequestSort(column.key)}
                      IconComponent={SortIcon}
                    >
                      {column.title}
                    </TableSortLabel>
                  ) : (
                    column.title
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            <AnimatePresence>
              {paginatedData.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  style={{
                    display: 'table-row'
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {formatCellValue(row[column.key], column.type)}
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="table-pagination">
          <Typography variant="body2" color="text.secondary">
            Showing {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
          </Typography>

          <TablePagination
            component="div"
            count={filteredAndSortedData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            size="small"
          />
        </div>
      )}
    </div>
  )
}

export default DataTable
