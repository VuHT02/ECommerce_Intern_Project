/**
 * Sửa nhãn tiếng Việt bị mất dấu thành '?' do cột VARCHAR / encoding sai.
 * Map regex → chuỗi đúng, dùng cờ gi (global, case-insensitive).
 */
const LABEL_REPAIRS = [
  [/\u0110i[?]n tho[?]i/gi, 'Điện thoại'],
  [/[Mm][aá]y t[ií]nh b[?]ng/gi, 'Máy tính bảng'],
  [/[Pp]h[?] ki[?]n/gi, 'Phụ kiện'],
  [/[Tt]hi[?]t b[?] [đd]i[?]n t[?]/gi, 'Thiết bị điện tử'],
  [/[đd]i[?]n t[?]/gi, 'điện tử'],
  [/[Ll]aptop [VvƯư][ăa]n ph[oò]ng/gi, 'Laptop Văn phòng'],
  [/[Ll]aptop [Đđ][ồo] h[oọ]a/gi, 'Laptop Đồ họa'],
];

/**
 * Cố gắng sửa chuỗi chứa dấu '?' bị hỏng.
 * Nếu chuỗi không chứa '?' → trả nguyên, tránh overhead.
 */
export function repairVietnameseLabel(value) {
  if (!value || typeof value !== 'string') return value;
  if (!value.includes('?')) return value;

  let next = value;
  for (const [pattern, replacement] of LABEL_REPAIRS) {
    next = next.replace(pattern, replacement);
  }
  return next;
}
