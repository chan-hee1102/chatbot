import AuthForm from '@/components/AuthForm';

export const metadata = {
  title: '로그인',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-100">
            {process.env.NEXT_PUBLIC_APP_NAME || 'AI Chat'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">개인 AI 어시스턴트 챗봇</p>
        </div>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
