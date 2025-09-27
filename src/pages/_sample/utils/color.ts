/**
 * HEX -> RGB 변환
 * @param hex "#fff" 또는 "#ffffff"
 * @returns [r, g, b]
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map(ch => ch + ch).join(""); // #abc → #aabbcc
  }
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * RGB -> HEX 변환
 * @param r 0-255
 * @param g 0-255
 * @param b 0-255
 * @returns "#rrggbb"
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map(v => v.toString(16).padStart(2, "0"))
      .join("")
      .toLowerCase()
  );
}

/**
 * 색상 보간 (startColor ~ endColor 사이)
 * @param minValue 최소 값
 * @param maxValue 최대 값
 * @param value 현재 값
 * @param startColor 시작 색상 (red, #fff, #ffffff, rgb(255,0,0) 지원)
 * @param endColor 끝 색상
 * @returns rgb(r,g,b) 문자열
 */
export function interpolateColor({
  minValue,
  maxValue,
  value,
  startColor,
  endColor,
}: {
  minValue: number;
  maxValue: number;
  value: number;
  startColor: string;
  endColor: string;
}): { r: number; g: number; b: number } {
  const parseColor = (color: string): [number, number, number] => {
    if (color.startsWith("#")) return hexToRgb(color);

    if (color.startsWith("rgb")) {
      const nums = color.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
      return [nums[0], nums[1], nums[2]];
    }

    const ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
      ctx.fillStyle = color;
      return hexToRgb(ctx.fillStyle);
    }

    throw new Error("지원하지 않는 색상 포맷: " + color);
  };

  const t = Math.min(1, Math.max(0, (value - minValue) / (maxValue - minValue)));
  const [r1, g1, b1] = parseColor(startColor);
  const [r2, g2, b2] = parseColor(endColor);

  const r = Math.round(r1 * (1 - t) + r2 * t);
  const g = Math.round(g1 * (1 - t) + g2 * t);
  const b = Math.round(b1 * (1 - t) + b2 * t);

  return { r, g, b };
}