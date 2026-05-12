# CLAUDE.md — 개인 AI 어시스턴트 챗봇 개발 가이드

> Claude Code가 이 프로젝트를 처음 열었을 때 반드시 이 파일 전체를 읽고 시작할 것.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 개인 AI 어시스턴트 챗봇 |
| 목적 | 웹 기반 범용 LLM 챗봇. 회원가입/로그인 기반, 대화 히스토리 영구 저장 |
| LLM | Google Gemini API (`gemini-2.5-flash`, env: `GEMINI_MODEL`) |
| 배포 | Railway (볼륨 마운트 포함) |

---

## 2. 기술 스택 (절대 변경 금지)

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 14.x |
| 스타일링 | Tailwind CSS | 3.x |
| DB | SQLite (`better-sqlite3`) | 최신 |
| LLM | `@google/generative-ai` | 최신 |
| 인증 | `jose` (JWT) + `bcryptjs` | 최신 |
| 마크다운 | `react-markdown` + `react-syntax-highlighter` | 최신 |

> **절대 규칙**: Prisma, Drizzle 등 ORM 사용 금지. `better-sqlite3` 직접 사용.  
> **절대 규칙**: `axios` 사용 금지. 네이티브 `fetch` 사용.  
> **절대 규칙**: 외부 Auth 라이브러리(NextAuth 등) 사용 금지. 직접 JWT 구현.

---

## 3. 디렉토리 구조

프로젝트 초기화 시 아래 구조를 그대로 생성할 것:

```
/
├── CLAUDE.md
├── .env.local                  # 환경변수 (gitignore)
├── .env.example                # 환경변수 템플릿 (git 포함)
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── package.json
│
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # / → /login 리다이렉트
│   │   ├── login/
│   │   │   └── page.tsx        # 로그인 페이지
│   │   ├── register/
│   │   │   └── page.tsx        # 회원가입 페이지
│   │   ├── chat/
│   │   │   ├── layout.tsx      # 사이드바 + 인증 가드
│   │   │   ├── page.tsx        # /chat → 첫 번째 대화 or 빈 화면
│   │   │   └── [id]/
│   │   │       └── page.tsx    # 특정 대화 세션
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   └── logout/route.ts
│   │       ├── conversations/
│   │       │   ├── route.ts         # GET (목록) / POST (생성)
│   │       │   └── [id]/route.ts    # DELETE
│   │       ├── messages/
│   │       │   └── [id]/route.ts    # GET (메시지 목록)
│   │       └── chat/
│   │           └── route.ts         # POST → SSE 스트리밍
│   │
│   ├── lib/
│   │   ├── db.ts               # SQLite 연결 싱글턴 + 초기화
│   │   ├── auth.ts             # JWT 발급/검증 유틸
│   │   └── gemini.ts           # Gemini API 래퍼
│   │
│   ├── components/
│   │   ├── Sidebar.tsx         # 대화 목록 사이드바
│   │   ├── ChatWindow.tsx      # 채팅 메인 영역
│   │   ├── MessageBubble.tsx   # 메시지 말풍선 (마크다운 렌더)
│   │   ├── MessageInput.tsx    # 입력창 + 전송 버튼
│   │   └── AuthForm.tsx        # 로그인/회원가입 공통 폼
│   │
│   ├── hooks/
│   │   ├── useChat.ts          # 채팅 상태 + SSE 스트리밍 로직
│   │   └── useConversations.ts # 대화 목록 상태 관리
│   │
│   └── middleware.ts           # JWT 인증 미들웨어 (Edge Runtime)
│
└── data/                       # Railway 볼륨 마운트 경로
    └── .gitkeep
```

---

## 4. 환경변수

`.env.local` 파일을 직접 생성하고 아래 값을 채울 것:

```env
# Gemini API (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=여기에_발급받은_키_입력

# JWT 서명 비밀키 (32자 이상 랜덤 문자열)
JWT_SECRET=여기에_랜덤_문자열_입력

# SQLite DB 파일 경로
DATABASE_PATH=./data/chat.db

# 앱 이름 (UI 표시용)
NEXT_PUBLIC_APP_NAME=AI Chat
```

`.env.example` 파일도 함께 생성 (실제 값 없이 키 이름만):

```env
GEMINI_API_KEY=
JWT_SECRET=
DATABASE_PATH=./data/chat.db
NEXT_PUBLIC_APP_NAME=AI Chat
```

---

## 5. 데이터베이스 스키마

`src/lib/db.ts` 에서 앱 시작 시 자동 초기화(`CREATE TABLE IF NOT EXISTS`).

```sql
-- 사용자
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    DATETIME DEFAULT (datetime('now'))
);

-- 대화 세션
CREATE TABLE IF NOT EXISTS conversations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL DEFAULT '새 대화',
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

-- 메시지
CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT    NOT NULL CHECK(role IN ('user', 'model')),
  content         TEXT    NOT NULL,
  created_at      DATETIME DEFAULT (datetime('now'))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
```

---

## 6. 핵심 구현 명세

### 6.1 인증 흐름

```
회원가입: POST /api/auth/register
  body: { email, password }
  - 이메일 형식 검증 (정규식)
  - 비밀번호 8자 이상 검증
  - 이메일 소문자 변환 후 중복 확인
  - bcrypt hash (saltRounds: 12)
  - DB 저장 후 201 반환

로그인: POST /api/auth/login
  body: { email, password }
  - bcrypt.compare 검증
  - JWT 생성 (payload: { userId, email }, exp: 7d)
  - HttpOnly; Secure; SameSite=Strict 쿠키에 저장
  - 200 반환

미들웨어: src/middleware.ts
  - matcher: ['/chat/:path*', '/api/conversations/:path*', '/api/messages/:path*', '/api/chat/:path*']
  - 쿠키에서 JWT 추출 → jose verify
  - 유효하지 않으면 /login 리다이렉트 (페이지) 또는 401 (API)
```

### 6.2 SSE 스트리밍 구현

```typescript
// POST /api/chat/route.ts 핵심 로직
export async function POST(req: Request) {
  // 1. JWT에서 userId 추출
  // 2. body: { conversationId, content } 파싱
  // 3. user 메시지 DB 저장
  // 4. 해당 conversation의 전체 메시지 이력 조회
  // 5. Gemini API 스트리밍 호출
  // 6. TransformStream으로 SSE 포맷 변환
  // 7. 스트림 완료 후 model 메시지 전체 DB 저장
  // 8. conversations.updated_at 갱신

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Gemini 스트리밍
  const geminiStream = await model.generateContentStream({ contents: history });

  (async () => {
    let fullText = '';
    for await (const chunk of geminiStream.stream) {
      const text = chunk.text();
      fullText += text;
      await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
    }
    // 완료 신호
    await writer.write(encoder.encode(`data: [DONE]\n\n`));
    // DB 저장
    saveMessage(conversationId, 'model', fullText);
    await writer.close();
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

### 6.3 컨텍스트 윈도우 관리

Gemini API 호출 시 전체 이력이 아닌 **최근 20개 메시지**만 전송:

```typescript
// src/lib/gemini.ts
const recentMessages = allMessages.slice(-20);
const contents = recentMessages.map(msg => ({
  role: msg.role,  // 'user' | 'model'
  parts: [{ text: msg.content }]
}));
```

### 6.4 대화 제목 자동 생성

```typescript
// 첫 번째 user 메시지 전송 시
if (isFirstMessage) {
  const title = content.slice(0, 20) + (content.length > 20 ? '...' : '');
  updateConversationTitle(conversationId, title);
}
```

---

## 7. UI/UX 명세

### 7.1 색상 팔레트 (Tailwind)

```
배경 (전체):     bg-gray-950
사이드바:        bg-gray-900
채팅 배경:       bg-gray-950
user 말풍선:     bg-blue-600 text-white
model 말풍선:    bg-gray-800 text-gray-100
입력창:          bg-gray-800 border-gray-700
버튼 (primary):  bg-blue-600 hover:bg-blue-700
버튼 (danger):   bg-red-600 hover:bg-red-700
```

### 7.2 레이아웃

```
모바일(~768px):  사이드바 숨김 (햄버거 메뉴로 토글)
데스크탑(768px+): 사이드바 고정 (width: 260px) + 채팅 영역 flex-1
```

### 7.3 UX 디테일

- 전송 중에는 입력창 비활성화 + 로딩 스피너 표시
- AI 응답 생성 중 스크롤 자동으로 하단 고정
- 엔터 키로 전송, Shift+Enter로 줄바꿈
- 대화 목록에서 현재 열린 대화 하이라이트
- 로그인/회원가입 폼 에러 메시지 인라인 표시

---

## 8. API 응답 형식

모든 API 응답은 아래 형식 준수:

```typescript
// 성공
{ success: true, data: { ... } }

// 실패
{ success: false, error: "에러 메시지" }
```

---

## 9. 개발 순서 (이 순서대로 진행)

Claude Code는 아래 순서를 반드시 지킬 것. 순서 바꾸지 말 것.

```
Step 1. 프로젝트 초기화
  - npx create-next-app@14 . --typescript --tailwind --app --src-dir --no-import-alias
  - 패키지 설치: better-sqlite3 @types/better-sqlite3 jose bcryptjs @types/bcryptjs
                 @google/generative-ai react-markdown react-syntax-highlighter
                 @types/react-syntax-highlighter

Step 2. 기반 설정
  - .env.local / .env.example 생성
  - src/lib/db.ts — SQLite 연결 + 스키마 초기화
  - src/lib/auth.ts — JWT 발급/검증
  - src/lib/gemini.ts — Gemini API 래퍼
  - src/middleware.ts — 인증 미들웨어

Step 3. API Routes
  - /api/auth/register, login, logout
  - /api/conversations (GET, POST)
  - /api/conversations/[id] (DELETE)
  - /api/messages/[id] (GET)
  - /api/chat (POST → SSE)

Step 4. 공통 컴포넌트
  - AuthForm.tsx
  - MessageBubble.tsx (마크다운 렌더 포함)
  - MessageInput.tsx
  - Sidebar.tsx

Step 5. 페이지
  - /login, /register
  - /chat/layout.tsx (사이드바 포함)
  - /chat/[id]/page.tsx

Step 6. 훅
  - useConversations.ts
  - useChat.ts (SSE 클라이언트 로직)

Step 7. 마무리
  - 반응형 CSS 점검
  - 에러 핸들링 점검
  - Railway 배포 설정
```

---

## 10. Railway 배포 설정

### 10.1 railway.toml

프로젝트 루트에 생성:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node server.js"
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"
```

### 10.2 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}
module.exports = nextConfig
```

### 10.3 볼륨 마운트

Railway 대시보드에서:
- Volume mount path: `/app/data`
- `DATABASE_PATH` 환경변수: `/app/data/chat.db`

### 10.4 환경변수 (Railway 대시보드 설정)

```
GEMINI_API_KEY      = (발급받은 키)
JWT_SECRET          = (랜덤 32자 이상)
DATABASE_PATH       = /app/data/chat.db
NEXT_PUBLIC_APP_NAME = AI Chat
NODE_ENV            = production
```

---

## 11. 절대 규칙 (위반 금지)

1. **DB 변경은 반드시 `db.ts` 의 `initializeDB()` 함수 내 `CREATE TABLE IF NOT EXISTS` 로만** — 마이그레이션 파일 별도 생성 금지
2. **모든 SQL은 Prepared Statement 사용** — 문자열 템플릿 직접 삽입 금지 (SQL Injection 방지)
3. **JWT 검증 없이 DB 접근하는 API 절대 금지** — 모든 `/api/conversations`, `/api/messages`, `/api/chat` 엔드포인트는 반드시 JWT 검증 후 처리
4. **`console.log` 는 개발 중 허용, 배포 전 모두 제거**
5. **타입스크립트 `any` 사용 금지** — 명시적 타입 정의 필수
6. **클라이언트 컴포넌트에서 직접 DB 접근 금지** — 반드시 API Route 경유
7. **에러 발생 시 사용자에게 에러 원문 노출 금지** — 내부 에러는 서버 로그, 사용자에게는 일반 메시지만

---

## 12. 헬스체크 API

배포 확인용으로 반드시 포함:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```
