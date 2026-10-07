import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.jsx';

// Khởi tạo TanStack QueryClient với cấu hình tối ưu caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 phút (dữ liệu coi là mới trong 5 phút, không refetch thừa)
      gcTime: 1000 * 60 * 15,    // 15 phút giữ trong bộ nhớ cache
      refetchOnWindowFocus: false, // Tránh refetch liên tục khi người dùng chuyển tab trình duyệt
      retry: 1, // Thử gọi lại 1 lần nếu gặp sự cố mạng
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
