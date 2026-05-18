# 할 일 관리 앱

순수 Vanilla JavaScript(ES6+)로 만든 개인용 할 일 관리 앱.
빌드 도구 없음. 외부 라이브러리 없음.

## 실행

```bash
# 브라우저에서 직접 열기
start index.html

# 데스크톱 최적화 버전
start web_design/index.html
```

서버 설정이나 패키지 설치가 필요 없습니다.

## 기능

| 기능 | 설명 |
|---|---|
| 할 일 추가 | 텍스트 입력 + 카테고리 / 우선순위 / 마감일 선택, Enter 또는 버튼 클릭 |
| 인라인 수정 | 텍스트 클릭 → contentEditable 전환, Enter 저장 / Escape 취소 |
| 메모/노트 | 📝 버튼으로 카드별 메모 영역 펼침/접힘, 포커스 이탈 시 자동 저장 |
| 완료 토글 | 원형 체크 버튼, 완료 시 취소선 + opacity 감소 |
| 삭제 | confirm 확인 후 제거 |
| 완료 일괄 삭제 | 완료 항목이 있을 때 버튼 표시 |
| 우선순위 | 🔴 높음 / 🟡 중간 / 🔵 낮음 배지 표시 및 정렬 |
| 필터 | 전체 / 미완료 / 완료 / 💼업무 / 🏠개인 / 📚공부 |
| 정렬 | 생성일순 / 카테고리순 / 완료 상태순 / 마감일순 / 우선순위순 / 수동(드래그 앤 드롭) |
| 검색 | 키워드 실시간 검색 + 일치 텍스트 하이라이트 |
| 자동 분류 | 입력 키워드로 카테고리 자동 추론 |
| 내보내기 | JSON 파일 다운로드 |
| 가져오기 | JSON 파일 업로드, 기존 데이터 자동 백업 |
| 통계 | 전체 / 완료 / 미완료 카드 + 진행률 프로그레스 바 |
| 다크 모드 | `prefers-color-scheme: dark` 자동 감지 |

## 버전

| 버전 | 경로 | 설명 |
|---|---|---|
| 모바일/기본 | `index.html` | 단일 컬럼, max-width 680px |
| 데스크톱 | `web_design/index.html` | 사이드바 + 메인 2단 레이아웃 |

> `file://` 프로토콜에서는 경로별로 origin이 분리되어 두 버전의 localStorage가 공유되지 않습니다. 데이터 이동 시 내보내기/가져오기를 사용하세요.

## 기술 스택

- HTML5 / CSS3 / Vanilla JavaScript (ES6+)
- 데이터 저장: `localStorage`
- 외부 라이브러리 없음, 빌드 도구 없음

## 데이터 구조

`localStorage` 키 `todos`에 JSON 배열로 저장됩니다.

```js
{
  id:        string,              // 고유 식별자
  text:      string,              // 할 일 내용 (최대 80자)
  category:  '업무' | '개인' | '공부',
  priority:  '높음' | '중간' | '낮음',
  done:      boolean,
  memo:      string | null,       // 메모 텍스트
  createdAt: number,              // Unix timestamp (ms)
  dueDate:   string | null,       // 'YYYY-MM-DD' 형식
}
```

## 파일 구조

```
index.html          — HTML 구조 (모바일 기준)
style.css           — CSS (모바일 기준)
script.js           — JavaScript (공통 로직)
web_design/
  index.html        — HTML 구조 (데스크톱 2단 레이아웃)
  style.css         — CSS (데스크톱 최적화)
  script.js         — JavaScript (루트와 동일한 로직)
README.md           — 이 파일
CLAUDE.md           — Claude Code 작업 가이드
```

## 라이선스

MIT
