import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
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

const VirtualTable = forwardRef(
  (
    {
      tableData,
      freezeLeft = 3,
      freezeRight = 2,
      columnsWidth = 200,
      checkboxColumnsWidth = 40,
      headerHeight = 70,
      rowHeight = 35,
    }: VirtualTableProps,
    ref
  ) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [sorting, setSorting] = useState<any[]>([]);
    const [columnFilters, setColumnFilters] = useState<any[]>([]);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const columns = tableData.columns;
    const rows = tableData.data;
    const data = useMemo(() => rows, [rows]);

    const columnFilterFn = useCallback(
      (row: any, columnId: string, filterValue: string) => {
        if (!filterValue) return true;
        const cellValue = String(row.getValue(columnId) ?? "").toLowerCase();
        return cellValue.includes(filterValue.toLowerCase());
      },
      []
    );

    const columnDefs = useMemo(() => {
      const defs: any[] = [
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
                selectedRows.size === table.getFilteredRowModel().rows.length &&
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

    // 🔍 검색 및 리셋 기능
    const handleSearch = (columnId: string) => {
      const inputEl = inputRefs.current[columnId];
      const value = inputEl?.value.trim() ?? "";
      const column = table.getColumn(columnId);
      if (column) column.setFilterValue(value);
    };

    const handleReset = (columnId: string) => {
      const inputEl = inputRefs.current[columnId];
      if (inputEl) inputEl.value = "";
      const column = table.getColumn(columnId);
      if (column) column.setFilterValue("");
    };

    // ✅ 부모에서 호출 가능한 함수
    const handlePrintSelected = () => {
      const filteredRows = table.getFilteredRowModel().rows;
      const selectedData = filteredRows
        .filter((r) => selectedRows.has(r.index))
        .map((r) => r.original);
      console.log("✅ 선택된 데이터:", selectedData);
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

            {/* 🔎 필터 입력행 */}
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
                          ref={(el) =>
                            (inputRefs.current[header.column.id] = el)
                          }
                          type="text"
                          placeholder="검색"
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleSearch(header.column.id);
                          }}
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
                            gap: "2px",
                            marginTop: "2px",
                          }}
                        >
                          <button
                            onClick={() => handleSearch(header.column.id)}
                            style={{
                              padding: "2px 4px",
                              fontSize: "10px",
                              cursor: "pointer",
                            }}
                          >
                            검색
                          </button>
                          <button
                            onClick={() => handleReset(header.column.id)}
                            style={{
                              padding: "2px 4px",
                              fontSize: "10px",
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
