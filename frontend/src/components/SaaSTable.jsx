import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export function SaaSTable({ data, columns, onRowClick, searchPlaceholder = "Search...", searchable = true, defaultPageSize = 5 }) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {searchable && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 24px' }}>
          <div className="input-sys" style={{ width: '250px' }}>
            <Search size={14} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
            <input
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
             {Object.keys(rowSelection).length} selected
          </div>
        </div>
      )}

      <div className="table-container" style={{ maxHeight: '500px' }}>
        <table className="table-clean" style={{ width: '100%' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} colSpan={header.colSpan} style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default', userSelect: 'none' }} onClick={header.column.getToggleSortingHandler()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span style={{ display: 'inline-flex', flexDirection: 'column', color: 'var(--text-muted)' }}>
                            {header.column.getIsSorted() === 'asc' ? <ChevronUp size={12} style={{color: 'var(--primary-600)'}}/> : header.column.getIsSorted() === 'desc' ? <ChevronDown size={12} style={{color: 'var(--primary-600)'}}/> : <ChevronDown size={12} opacity={0.3} />}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No results found.
                </td>
              </tr>
            ) : (
               table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.getIsSelected() ? 'selected' : ''}
                  onClick={(e) => {
                    // prevent row click if clicking checkbox cell roughly
                    if(e.target.tagName?.toLowerCase() === 'input' && e.target.type === 'checkbox') return;
                    if(onRowClick) onRowClick(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div style={{ display: 'flex', gap: '4px', padding: '12px 24px', borderTop: '1px solid var(--border-subtle)', justifyContent: 'flex-end', alignItems: 'center' }}>
           <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '16px' }}>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
           </span>
           <button 
             className="btn-icon" 
             onClick={() => table.previousPage()} 
             disabled={!table.getCanPreviousPage()}
             style={{ opacity: !table.getCanPreviousPage() ? 0.3 : 1 }}
           >
             <ChevronLeft size={16} />
           </button>
           <button 
             className="btn-icon" 
             onClick={() => table.nextPage()} 
             disabled={!table.getCanNextPage()}
             style={{ opacity: !table.getCanNextPage() ? 0.3 : 1 }}
           >
             <ChevronRight size={16} />
           </button>
        </div>
      )}
    </div>
  );
}

// Checkbox component for selection column
export const TableCheckbox = ({ checked, onChange }) => (
  <input 
    type="checkbox" 
    checked={checked} 
    onChange={onChange} 
    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-600)' }} 
  />
);
