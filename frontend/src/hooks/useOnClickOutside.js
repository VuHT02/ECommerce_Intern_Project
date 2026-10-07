import { useEffect } from 'react';

/**
 * Custom Hook useOnClickOutside:
 * Lắng nghe sự kiện click chuột ra bên ngoài một phần tử (dùng ref)
 * Khi click ra ngoài vùng phần tử, tự động gọi callback handler (ví dụ: đóng dropdown)
 * 
 * @param {React.RefObject} ref - Ref tham chiếu đến DOM element của dropdown
 * @param {Function} handler - Hàm callback thực thi khi click bên ngoài
 */
export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Không làm gì nếu ref chưa gắn hoặc click vào chính phần tử đó/con của nó
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export default useOnClickOutside;
