import React, { useState, useMemo, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualTableProps {
  tableData: {
    columns: string[];
    data: Record<string, string>[];
  };
  freezeLeft?: number;
  freezeRight?: number;
  columnsWidth?: number;
  checkboxColumnsWidth?: number;
  headerHeight?: number;
  rowHeight?: number;
}

const VirtualTable = forwardRef(({
  tableData,
  freezeLeft = 3,
  freezeRight = 2,
  columnsWidth = 200,
  checkboxColumnsWidth = 40,
  headerHeight = 70,
  rowHeight = 35,
}: VirtualTableProps, ref) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<any[]>([]);
  const [columnFilters, setColumnFilters] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [tempFilters, setTempFilters] = useState<Record<string, string>>({});

  const columns = tableData.columns;
  const rows = tableData.data;
  const data = useMemo(() => rows, [rows]);

  const columnFilterFn = useCallback(
    (row: any, columnId: string, filterValue: string) => {
      if (!filterValue) return true;
      const cellValue = String(row.getValue(columnId) ?? '').toLowerCase();
      return cellValue.includes(filterValue.toLowerCase());
    },
    []
  );

  const columnDefs = useMemo(() => {
    const defs: any[] = [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            onChange={e => {
              const filteredRows = table.getFilteredRowModel().rows;
              if (e.target.checked) {
                setSelectedRows(new Set(filteredRows.map(r => r.index)));
              } else {
                setSelectedRows(new Set());
              }
            }}
            checked={
              selectedRows.size > 0 &&
              selectedRows.size === table.getFilteredRowModel().rows.length &&
              table.getFilteredRowModel().rows.length > 0
            }
          />
        ),
        cell: (info: any) => (
          <input
            type="checkbox"
            checked={selectedRows.has(info.row.index)}
            onChange={e => {
              const newSet = new Set(selectedRows);
              if (e.target.checked) newSet.add(info.row.index);
              else newSet.delete(info.row.index);
              setSelectedRows(newSet);
            }}
          />
        ),
        size: checkboxColumnsWidth,
      },
      ...columns.map(col => ({
        accessorKey: col,
        header: col,
        filterFn: columnFilterFn,
        cell: (info: any) => info.row.original[col] ?? '',
      })),
    ];
    return defs;
  }, [columns, data, selectedRows, columnFilterFn]);

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  const totalCols = columnDefs.length;

  const getStickyStyle = (colIndex: number): React.CSSProperties => {
    if (colIndex < freezeLeft) {
      let offset = (colIndex - 1) * columnsWidth + checkboxColumnsWidth;
      if (colIndex === 0) offset = 0;
      return { position: 'sticky', left: `${offset}px`, zIndex: 3, background: '#fff' };
    }
    if (colIndex >= totalCols - freezeRight) {
      const rightOffset = (totalCols - 1 - colIndex) * columnsWidth;
      return { position: 'sticky', right: `${rightOffset}px`, zIndex: 3, background: '#fff', borderLeft: '1px solid #eee' };
    }
    return {};
  };

  const applyFilters = () => {
    Object.keys(tempFilters).forEach(key => {
      const column = table.getColumn(key);
      if (column) column.setFilterValue(tempFilters[key] ?? '');
    });
  };

  // 부모에서 호출 가능한 함수
  const handlePrintSelected = () => {
    const filteredRows = table.getFilteredRowModel().rows;
    const selectedData = filteredRows.filter(r => selectedRows.has(r.index)).map(r => r.original);
    console.log('✅ 선택된 데이터:', selectedData);
  };

  useImperativeHandle(ref, () => ({
    handlePrintSelected,
  }));

  return (
    <div
      ref={parentRef}
      style={{
        height: '600px',
        overflow: 'auto',
        border: '1px solid #ccc',
        position: 'relative',
        fontFamily: 'sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          width: `${(columnDefs.length - 1) * columnsWidth + checkboxColumnsWidth}px`,
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 4,
            background: '#f0f0f0',
            borderBottom: '1px solid #ccc',
            height: `${headerHeight}px`,
          }}
        >
          <div style={{ display: 'flex' }}>
            {table.getHeaderGroups().map((headerGroup) =>
              headerGroup.headers.map((header, i) => (
                <div
                  key={header.id}
                  style={{
                    minWidth:
                      header.column.columnDef.id === 'select'
                        ? checkboxColumnsWidth
                        : columnsWidth,
                    padding: '6px 8px',
                    fontWeight: 'bold',
                    borderRight: '1px solid #ddd',
                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                    userSelect: 'none',
                    ...getStickyStyle(i),
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc'
                    ? ' 🔼'
                    : header.column.getIsSorted() === 'desc'
                      ? ' 🔽'
                      : ''}
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
            {table.getHeaderGroups()[0].headers.map((header, i) => (
              <div
                key={header.id}
                style={{
                  minWidth:
                    header.column.columnDef.id === 'select'
                      ? checkboxColumnsWidth
                      : columnsWidth,
                  borderRight: '1px solid #eee',
                  padding: '4px 6px',
                  background: '#fafafa',
                  ...getStickyStyle(i),
                }}
              >
                {header.column.getCanFilter() && header.column.columnDef.id !== 'select' && (
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <input
                      type="text"
                      value={tempFilters[header.column.id] ?? ''}
                      onChange={(e) =>
                        setTempFilters((prev) => ({ ...prev, [header.column.id]: e.target.value }))
                      }
                      placeholder="검색"
                      style={{
                        width: '100%',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        padding: '2px 4px',
                        fontSize: '12px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                      <button
                        onClick={() =>
                          header.column.setFilterValue(tempFilters[header.column.id] ?? '')
                        }
                        style={{ padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }}
                      >
                        검색
                      </button>
                      <button
                        onClick={() => {
                          setTempFilters((prev) => ({ ...prev, [header.column.id]: '' }));
                          header.column.setFilterValue('');
                        }}
                        style={{ padding: '2px 4px', fontSize: '10px', cursor: 'pointer' }}
                      >
                        리셋
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 데이터 행 */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = table.getRowModel().rows[virtualRow.index];
          if (!row) return null;
          return (
            <div
              key={row.id}
              style={{
                display: 'flex',
                position: 'absolute',
                top: 0,
                left: 0,
                width: 'fit-content',
                transform: `translateY(${virtualRow.start + headerHeight}px)`,
                background: selectedRows.has(row.index) ? '#e6f3ff' : 'transparent',
                height: `${rowHeight}px`,
              }}
            >
              {row.getVisibleCells().map((cell, i) => {
                const isSticky = i < freezeLeft || i >= totalCols - freezeRight;
                return (
                  <div
                    key={cell.id}
                    style={{
                      minWidth:
                        cell.column.columnDef.id === 'select'
                          ? checkboxColumnsWidth
                          : columnsWidth,
                      padding: '8px',
                      borderRight: '1px solid #eee',
                      borderBottom: '1px solid #eee',
                      height: `${rowHeight}px`,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      ...getStickyStyle(i),
                      background: selectedRows.has(row.index) ? '#e6f3ff' : isSticky ? '#fff' : undefined,
                      zIndex: isSticky ? 2 : 1,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  )
})

export default VirtualTable;


import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChartBar from "./ChartBar";
import ChartPage from "./ChartPage";
import VirtualTable from "./VirtualTable";

const Chart = () => {
    const loc = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(loc.search);
    const child = searchParams.get('child') ? searchParams.get('child') : 'ChartBar';

    const baseUrl = loc.pathname;

	const [data, setData] = useState<any>({
		columns: [],
		data: []
	})
	const handleDataSet = () => {
			const columns = [
				"데이터19",
				"데이터1",
				"데이터2",
				"100",
				"데이터3",
				"데이터4",
				"데이터5",
				"데이터6",
				"데이터7",
				"데이터8",
				"데이터9",
				"데이터10",
				"데이터11",
				"데이터12",
				"데이터13",
				"데이터14",
				"데이터15",
				"데이터16",
				"데이터17",
				"데이터18",
				"데이터20",
				"데이터21",
				"데이터22",
				"데이터23",
				"데이터24",
				"데이터25",
				"데이터26",
				"데이터27",
				"데이터28",
				"데이터29",
				"데이터30",
			];

			const data = Array.from({ length: 100000 }, (_, i) => ({
				데이터1: `${i + 1}-1`,
				데이터2: `${i + 1}-2 2222222222222222222222222222222222222 123123 assdasd`,
				100: `1`,
				데이터3: ``,
				데이터4: `${i + 1}-4`,
				데이터5: `${i + 1}-5`,
				데이터6: `${i + 1}-6`,
				데이터7: `${i + 1}-7`,
				데이터8: `${i + 1}-8`,
				데이터9: `${i + 1}-9`,
				데이터10: `${i + 1}-10`,
				데이터11: `${i + 1}-11`,
				데이터12: `${i + 1}-12`,
				데이터13: `${i + 1}-13`,
				데이터14: `${i + 1}-14`,
				데이터15: `${i + 1}-15`,
				데이터16: `${i + 1}-16`,
				데이터17: `${i + 1}-17`,
				데이터18: `${i + 1}-18`,
				데이터19: `${i + 1}-19`,
				데이터20: `${i + 1}-20`,
				데이터21: `${i + 1}-21`,
				데이터22: `${i + 1}-22`,
				데이터23: `${i + 1}-23`,
				데이터24: `${i + 1}-24`,
				데이터25: `${i + 1}-25`,
				데이터26: `${i + 1}-26`,
				데이터27: `${i + 1}-27`,
				데이터28: `${i + 1}-28`,
				데이터29: `${i + 1}-29`,
				데이터30: `${i + 1}-30`,
				
			}));
		setData({
			columns: columns,
			data: data
		})
	}
	const tableRef = useRef<any>(null);
	const handleButtonClick = () => {
		tableRef.current?.handlePrintSelected();
	}
    return (
        <>
            <div style={{marginBottom: '30px'}}>
                <button onClick={() => navigate(`${baseUrl}?child=ChartBar`)}>ChartBar</button>
                <button 
                    // 버튼 클릭 시 URL은 /pathname?child=ChartPage 로 초기화됩니다.
                    onClick={() => navigate(`${baseUrl}?child=ChartPage`)}
                >
                    ChartPage
                </button>
                <button onClick={() => navigate(`${baseUrl}?child=VirtualTable`)}>VirtualTable</button>
            </div>
            
            {/* 💡 핵심: key prop을 사용하여 URL 쿼리가 바뀔 때마다 컴포넌트를 강제로 재생성합니다. */}
            {child === 'ChartBar' && <ChartBar />}
            {child === 'ChartPage' && <ChartPage key={loc.search} />} 
            <div style={{width: '80%', margin: '0 auto'}}>
				<button onClick={handleDataSet}>데이터 보기</button>
				<button onClick={handleButtonClick}>부모에서 선택 데이터 출력</button>
				{child === 'VirtualTable' && <VirtualTable ref={tableRef} tableData={data} key={loc.search} />}
			</div>
        </>
    );
};

export default Chart;
