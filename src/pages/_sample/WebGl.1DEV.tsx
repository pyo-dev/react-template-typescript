HeatMapGroupType {
  title: string;
  children: HeatMapGroupType;
}

HeatMapScatterTpye {
  x_addr_in_mat: number;
  y_addr_in_mat: number;
  value: number;
  box_index: number;
  bnk_id?: number;
  mat_id?: number;
  chanel_id?: number;
  pc_id?: number;
  hex_id?: number;
  x_addr?: number;
  y_addr?: number;
}

HeatMapApiType {
  success: boolean;
  meassge: string;
  value_range: {
    min: number;
    max: number;
  }
  colums: string[];
  data: HeatMapScatterTpye[][];
}

HeatMapPropsType {
  chartType?: string;
  height?: number;
  valueMin?: number;
  valueMax?: number;
  xBoxCount: number;
  yBoxCount: number;
  pointerSeries: HeatMapScatterTpye[][];
  selectEvent?: (data: HeatMapScatterTpye[][]) => void;
}



useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let wheelTimeout: NodeJS.Timeout | null = null;

    const handleWheel = (ev: WheelEvent) => {
        ev.preventDefault();

        if (ev.deltaY < 0) {
            handleZoomIn();
        } else {
            if (zoomLevel <= 1) return;
            handleZoomOut();
        }

        // 휠 종료 감지 (디바운스)
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            console.log("✅ 휠 동작 끝!");
            // 여기서 원하는 동작 실행 (예: 최종 렌더링, 서버 저장 등)
        }, 200); // 200ms 동안 추가 이벤트 없으면 "끝"이라고 판단
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
        canvas.removeEventListener("wheel", handleWheel);
        if (wheelTimeout) clearTimeout(wheelTimeout);
    };

}, [zoomLevel]);



===== LICENSE BEGIN =====
13187304-31102015
00001!xtAMrFykMbWmUY57ZegHceEQ
7XDdNXO"pYO8b4rMVIeSFXtyyhz9YW
3XQFwSOOKMPWYGDiTSakSoiZsGMOXb
===== LICENSE END =====

