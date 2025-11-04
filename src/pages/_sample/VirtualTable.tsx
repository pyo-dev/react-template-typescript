import React, {
  useState,
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import debounce from "lodash.debounce";

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

export interface VirtualTableHandle {
  handlePrintSelected: () => any[];
}

const VirtualTable = forwardRef<VirtualTableHandle, VirtualTableProps>(
  (
    {
      tableData,
      freezeLeft = 3,
      freezeRight = 2,
      columnsWidth = 200,
      checkboxColumnsWidth = 40,
      headerHeight = 70,
      rowHeight = 35,
    },
    ref
  ) => {
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
        const rawValue = row?.getValue?.(columnId);
        const cellValue =
          rawValue != null ? String(rawValue).toLowerCase() : "";
        return cellValue.includes(filterValue.toLowerCase());
      },
      []
    );

    /** ✅ columns 메모이제이션 */
    const tableColumns = useMemo(
      () => [
        {
          id: "select",
          header: () => (
            <input
              type="checkbox"
              onChange={(e) => {
                const filteredRows = table.getFilteredRowModel().rows;
                if (e.target.checked) {
                  setSelectedRows(new Set(filteredRows.map((r) => r.index)));
                } else {
                  setSelectedRows(new Set());
                }
              }}
              checked={
                selectedRows.size > 0 &&
                selectedRows.size ===
                  table.getFilteredRowModel().rows.length &&
                table.getFilteredRowModel().rows.length > 0
              }
            />
          ),
          cell: (info: any) => (
            <input
              type="checkbox"
              checked={selectedRows.has(info.row.index)}
              onChange={(e) => {
                const newSelected = new Set(selectedRows);
                if (e.target.checked) newSelected.add(info.row.index);
                else newSelected.delete(info.row.index);
                setSelectedRows(newSelected);
              }}
            />
          ),
          size: checkboxColumnsWidth,
        },
        ...columns.map((col) => ({
          accessorKey: col,
          header: col,
          filterFn: columnFilterFn,
          cell: (info: any) => info.row.original[col] ?? "",
        })),
      ],
      [columns, selectedRows, columnFilterFn]
    );

    /** ✅ 테이블 인스턴스 useMemo로 고정 */
    const table = useMemo(() => {
      return useReactTable({
        data,
        columns: tableColumns,
        state: { sorting, columnFilters },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
      });
    }, [data, tableColumns, sorting, columnFilters]);

    const rowVirtualizer = useVirtualizer({
      count: table.getRowModel().rows.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => rowHeight,
      overscan: 10,
    });

    /** ✅ 디바운스 적용 (입력 딜레이 완화) */
    const debouncedSetTempFilters = useMemo(
      () =>
        debounce((columnId: string, value: string) => {
          setTempFilters((prev) => ({ ...prev, [columnId]: value }));
        }, 300),
      []
    );

    const handleFilterInput = (columnId: string, value: string) => {
      debouncedSetTempFilters(columnId, value);
    };

    const handleSearch = useCallback(() => {
      Object.entries(tempFilters).forEach(([key, value]) => {
        const column = table.getColumn(key);
        if (column) column.setFilterValue(value || undefined);
      });
    }, [table, tempFilters]);

    const handleReset = useCallback(() => {
      setTempFilters({});
      table.resetColumnFilters();
    }, [table]);

    const getStickyStyle = (colIndex: number): React.CSSProperties => {
      const totalCols = table.getAllColumns().length;
      if (colIndex < freezeLeft) {
        let offset = (colIndex - 1) * columnsWidth + checkboxColumnsWidth;
        if (colIndex === 0) offset = 0;
        return {
          position: "sticky",
          left: `${offset}px`,
          zIndex: 3,
          background: "#fff",
        };
      }
      if (colIndex >= totalCols - freezeRight) {
        const rightOffset = (totalCols - 1 - colIndex) * columnsWidth;
        return {
          position: "sticky",
          right: `${rightOffset}px`,
          zIndex: 3,
          background: "#fff",
          borderLeft: "1px solid #eee",
        };
      }
      return {};
    };

    /** 🔹 부모에서 호출 가능한 함수 */
    const handlePrintSelected = () => {
      const filteredRows = table.getFilteredRowModel().rows;
      const selectedData = filteredRows
        .filter((r) => selectedRows.has(r.index))
        .map((r) => r.original);
      console.log("✅ 선택된 데이터:", selectedData);
      return selectedData;
    };

    useImperativeHandle(ref, () => ({
      handlePrintSelected,
    }));

    return (
      <div
        ref={parentRef}
        style={{
          height: "600px",
          overflow: "auto",
          border: "1px solid #ccc",
          position: "relative",
          fontFamily: "sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            width: `${table.getAllColumns().length * columnsWidth}px`,
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {/* 헤더 영역 */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 4,
              background: "#f0f0f0",
              borderBottom: "1px solid #ccc",
            }}
          >
            {/* 헤더 타이틀 */}
            <div style={{ display: "flex" }}>
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header, i) => (
                  <div
                    key={header.id}
                    style={{
                      minWidth:
                        header.column.columnDef.id === "select"
                          ? checkboxColumnsWidth
                          : columnsWidth,
                      padding: "6px 8px",
                      fontWeight: "bold",
                      borderRight: "1px solid #ddd",
                      cursor: header.column.getCanSort()
                        ? "pointer"
                        : "default",
                      userSelect: "none",
                      ...getStickyStyle(i),
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === "asc"
                      ? " 🔼"
                      : header.column.getIsSorted() === "desc"
                      ? " 🔽"
                      : ""}
                  </div>
                ))
              )}
            </div>

            {/* 필터 입력 + 버튼 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #ccc",
                background: "#fafafa",
              }}
            >
              {table.getHeaderGroups()[0].headers.map((header, i) => (
                <div
                  key={header.id}
                  style={{
                    minWidth:
                      header.column.columnDef.id === "select"
                        ? checkboxColumnsWidth
                        : columnsWidth,
                    borderRight: "1px solid #eee",
                    padding: "4px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    ...getStickyStyle(i),
                  }}
                >
                  {header.column.getCanFilter() &&
                    header.column.columnDef.id !== "select" && (
                      <>
                        <input
                          type="text"
                          value={tempFilters[header.column.id] ?? ""}
                          onChange={(e) =>
                            handleFilterInput(
                              header.column.id,
                              e.target.value
                            )
                          }
                          placeholder="검색어 입력"
                          style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            borderRadius: "3px",
                            padding: "2px 4px",
                            fontSize: "12px",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            onClick={handleSearch}
                            style={{
                              padding: "2px 6px",
                              border: "1px solid #999",
                              borderRadius: "4px",
                              cursor: "pointer",
                              background: "#007bff",
                              color: "#fff",
                              fontSize: "11px",
                            }}
                          >
                            검색
                          </button>
                          <button
                            onClick={handleReset}
                            style={{
                              padding: "2px 6px",
                              border: "1px solid #999",
                              borderRadius: "4px",
                              cursor: "pointer",
                              background: "#ccc",
                              fontSize: "11px",
                            }}
                          >
                            리셋
                          </button>
                        </div>
                      </>
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
                  display: "flex",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transform: `translateY(${
                    virtualRow.start + headerHeight
                  }px)`,
                  height: `${rowHeight}px`,
                  background: selectedRows.has(row.index)
                    ? "#e6f3ff"
                    : "transparent",
                }}
              >
                {row.getVisibleCells().map((cell, i) => {
                  const isSticky =
                    i < freezeLeft ||
                    i >= table.getAllColumns().length - freezeRight;
                  return (
                    <div
                      key={cell.id}
                      style={{
                        minWidth:
                          cell.column.columnDef.id === "select"
                            ? checkboxColumnsWidth
                            : columnsWidth,
                        padding: "8px",
                        borderRight: "1px solid #eee",
                        borderBottom: "1px solid #eee",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "flex",
                        alignItems: "center",
                        ...getStickyStyle(i),
                        background: selectedRows.has(row.index)
                          ? "#e6f3ff"
                          : isSticky
                          ? "#fff"
                          : undefined,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default VirtualTable;
