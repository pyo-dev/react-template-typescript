import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  ChangeEvent,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

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

const VirtualTable = forwardRef<HTMLDivElement, VirtualTableProps>(
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
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [tempFilters, setTempFilters] = useState<Record<string, string>>({});

    const data = useMemo(() => tableData.data, [tableData.data]);
    const columns = tableData.columns;

    // 필터 함수
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

    // 컬럼 정의
    const columnDefs = useMemo<ColumnDef<any>[]>(
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
                const newSet = new Set(selectedRows);
                if (e.target.checked) newSet.add(info.row.index);
                else newSet.delete(info.row.index);
                setSelectedRows(newSet);
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

    // ✅ 버튼으로 필터 적용
    const applyFilters = useCallback(() => {
      Object.keys(tempFilters).forEach((key) => {
        const column = table.getColumn(key);
        if (column) column.setFilterValue(tempFilters[key] ?? "");
      });
    }, [table, tempFilters]);

    // ✅ 선택 데이터 반환 (부모 호출용)
    const handlePrintSelected = useCallback(() => {
      const filteredRows = table.getFilteredRowModel().rows;
      const selectedData = filteredRows
        .filter((r) => selectedRows.has(r.index))
        .map((r) => r.original);
      return selectedData;
    }, [table, selectedRows]);

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
            width: `${(columnDefs.length - 1) * columnsWidth + checkboxColumnsWidth}px`,
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 4,
              background: "#f0f0f0",
              borderBottom: "1px solid #ccc",
              height: `${headerHeight}px`,
            }}
          >
            {/* 컬럼명 */}
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

            {/* 필터 라인 */}
            <div style={{ display: "flex", borderBottom: "1px solid #ccc" }}>
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
                    background: "#fafafa",
                    ...getStickyStyle(i),
                  }}
                >
                  {header.column.getCanFilter() &&
                    header.column.columnDef.id !== "select" && (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <input
                          type="text"
                          value={tempFilters[header.column.id] ?? ""}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const value = e.target.value;
                            setTempFilters((prev) => ({
                              ...prev,
                              [header.column.id]: value,
                            }));
                          }}
                          placeholder="검색어 입력"
                          style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            borderRadius: "3px",
                            padding: "2px 4px",
                            fontSize: "12px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "2px", marginTop: "4px" }}>
                          <button
                            onClick={() => {
                              const value = tempFilters[header.column.id] ?? "";
                              header.column.setFilterValue(value);
                            }}
                            style={{
                              flex: 1,
                              padding: "2px 4px",
                              fontSize: "11px",
                              cursor: "pointer",
                            }}
                          >
                            검색
                          </button>
                          <button
                            onClick={() => {
                              setTempFilters((prev) => ({
                                ...prev,
                                [header.column.id]: "",
                              }));
                              header.column.setFilterValue("");
                            }}
                            style={{
                              flex: 1,
                              padding: "2px 4px",
                              fontSize: "11px",
                              cursor: "pointer",
                            }}
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
                  display: "flex",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "fit-content",
                  transform: `translateY(${virtualRow.start + headerHeight}px)`,
                  background: selectedRows.has(row.index)
                    ? "#e6f3ff"
                    : "transparent",
                  height: `${rowHeight}px`,
                }}
              >
                {row.getVisibleCells().map((cell, i) => {
                  const isSticky =
                    i < freezeLeft || i >= totalCols - freezeRight;
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
                        height: `${rowHeight}px`,
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
                        zIndex: isSticky ? 2 : 1,
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
