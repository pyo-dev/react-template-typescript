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
