export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex items-center justify-center text-center px-6 bg-white">
      <div className="max-w-md">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
          무엇을 도와드릴까요?
        </h2>
        <p className="text-sm text-gray-500">
          좌측에서 대화를 선택하거나{' '}
          <span className="font-medium text-gray-900">+ 새 대화</span> 버튼을 눌러
          시작하세요.
        </p>
      </div>
    </div>
  );
}
