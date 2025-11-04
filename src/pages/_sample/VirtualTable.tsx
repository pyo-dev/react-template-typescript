import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
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
  columnsWidth?: number;
  rowHeight?: number;
  headerHeight?: number;
}

export interface VirtualTableHandle {
  handlePrintSelected: () => any[];
}

const VirtualTable = forwardRef<VirtualTableHandle, VirtualTableProps>(
  (
    {
      tableData,
      columnsWidth = 200,
      rowHeight = 35,
      headerHeight = 70,
    },
    ref
  ) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [sorting, setSorting] = useState<any[]>([]);
    const [columnFilters, setColumnFilters] = useState<any[]>([]);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [tempFilters, setTempFilters] = useState<Record<string, string>>({});

    /** ✅ 데이터 메모이제이션 */
    const data = useMemo(() => tableData.data, [tableData.data]);

    /** ✅ 필터 함수 */
    const columnFilterFn = useCallback(
      (row: any, columnId: string, filterValue: string) => {
        if (!filterValue) return true;
        const value = row?.getValue?.(columnId);
        return String(value ?? "")
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      },
      []
    );

    /** ✅ 컬럼 정의 */
    const columns = useMemo(
      () => [
        {
          id: "select",
          header: () => (
            <input
              type="checkbox"
              onChange={(e) => {
                const filteredRows = table.getFilteredRowModel().rows;
                if (e.target.checked)
                  setSelectedRows(new Set(filteredRows.map((r) => r.index)));
                else setSelectedRows(new Set());
              }}
            />
          ),
          cell: (info: any) => (
            <input
              type="checkbox"
              checked={selectedRows.has(info.row.index)}
              onChange={(e) => {
                const next = new Set(selectedRows);
                if (e.target.checked) next.add(info.row.index);
                else next.delete(info.row.index);
                setSelectedRows(next);
              }}
            />
          ),
          size: 40,
        },
        ...tableData.columns.map((col) => ({
          accessorKey: col,
          header: col,
          filterFn: columnFilterFn,
          cell: (info: any) => info.getValue() ?? "",
        })),
      ],
      [tableData.columns, selectedRows, columnFilterFn]
    );

    /** ✅ 테이블 인스턴스 (메모 유지) */
    const table = useReactTable({
      data,
      columns,
      state: { sorting, columnFilters },
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
    });

    /** ✅ Virtual Scroll */
    const rowVirtualizer = useVirtualizer({
      count: table.getRowModel().rows.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => rowHeight,
      overscan: 10,
    });

    /** ✅ 입력 임시 저장 (즉시 필터X) */
    const handleInputChange = (colId: string, value: string) => {
      setTempFilters((prev) => ({ ...prev, [colId]: value }));
    };

    /** ✅ 검색 버튼 눌렀을 때만 필터 반영 */
    const handleSearch = () => {
      const filters = Object.entries(tempFilters)
        .filter(([_, v]) => v.trim() !== "")
        .map(([id, value]) => ({ id, value }));
      setColumnFilters(filters);
    };

    /** ✅ 리셋 버튼 */
    const handleReset = () => {
      setTempFilters({});
      setColumnFilters([]);
    };

    /** ✅ 부모에서 호출 가능한 함수 */
    const handlePrintSelected = () => {
      const filteredRows = table.getFilteredRowModel().rows;
      const selectedData = filteredRows
        .filter((r) => selectedRows.has(r.index))
        .map((r) => r.original);
      console.log("✅ 선택된 데이터:", selectedData);
      return selectedData;
    };

    useImperativeHandle(ref, () => ({ handlePrintSelected }));

    return (
      <div
        ref={parentRef}
        style={{
          height: "600px",
          overflow: "auto",
          border: "1px solid #ccc",
          fontFamily: "sans-serif",
          fontSize: "13px",
          whiteSpace: "nowrap",
          position: "relative",
        }}
      >
        {/* 🔹 헤더 영역 */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#f8f8f8",
            borderBottom: "1px solid #ccc",
          }}
        >
          {/* ✅ 정렬 가능한 헤더 타이틀 */}
          <div style={{ display: "flex" }}>
            {table.getHeaderGroups().map((hg) =>
              hg.headers.map((header) => (
                <div
                  key={header.id}
                  style={{
                    width:
                      header.column.columnDef.id === "select"
                        ? 40
                        : columnsWidth,
                    padding: "6px 8px",
                    borderRight: "1px solid #ddd",
                    fontWeight: "bold",
                    cursor: header.column.getCanSort() ? "pointer" : "default",
                    userSelect: "none",
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

          {/* 🔹 각 컬럼별 필터 입력 + 버튼 */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              borderTop: "1px solid #ddd",
              background: "#fafafa",
            }}
          >
            {table.getHeaderGroups()[0].headers.map((header) => (
              <div
                key={header.id}
                style={{
                  width:
                    header.column.columnDef.id === "select"
                      ? 40
                      : columnsWidth,
                  borderRight: "1px solid #eee",
                  padding: "4px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {header.column.getCanFilter() &&
                  header.column.columnDef.id !== "select" && (
                    <>
                      <input
                        type="text"
                        placeholder="검색어 입력"
                        value={tempFilters[header.column.id] ?? ""}
                        onChange={(e) =>
                          handleInputChange(header.column.id, e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "12px",
                          border: "1px solid #ccc",
                          borderRadius: "3px",
                        }}
                      />
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={handleSearch}
                          style={{
                            flex: 1,
                            background: "#007bff",
                            color: "#fff",
                            border: "1px solid #007bff",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          검색
                        </button>
                        <button
                          onClick={handleReset}
                          style={{
                            flex: 1,
                            background: "#ccc",
                            border: "1px solid #999",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "12px",
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

        {/* 🔹 데이터 영역 */}
        <div
          style={{
            position: "relative",
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((vr) => {
            const row = table.getRowModel().rows[vr.index];
            return (
              <div
                key={row.id}
                style={{
                  display: "flex",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transform: `translateY(${vr.start + headerHeight}px)`,
                  height: `${rowHeight}px`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    style={{
                      width:
                        cell.column.columnDef.id === "select"
                          ? 40
                          : columnsWidth,
                      borderRight: "1px solid #eee",
                      borderBottom: "1px solid #eee",
                      padding: "6px",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default VirtualTable;
