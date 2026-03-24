import { Link } from 'react-router';
import { Button } from '../components/Button';

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#EEF3F8] px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-12 text-center shadow-lg">
        <h1 className="text-6xl font-black mb-4 text-[#0064FF]">404</h1>
        <h2 className="text-xl font-bold text-[#0F1E32] mb-2">페이지를 찾을 수 없습니다</h2>
        <p className="mb-8 text-[#5F6E82]">요청한 페이지가 삭제되었거나 주소가 변경되었습니다.</p>
        <Link to="/">
          <Button className="w-full rounded-2xl shadow-md">홈으로 돌아가기</Button>
        </Link>
      </div>
    </div>
  );
}
