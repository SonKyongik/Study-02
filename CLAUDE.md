# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

순수 Vanilla JavaScript(ES6+)로 만든 개인용 할 일 관리 앱. 빌드 도구 없음. 외부 라이브러리 없음.

## 실행 방법

별도 서버 불필요. `index.html`을 브라우저에서 직접 열면 된다.

```
# Windows
start index.html

# WSL에서 Windows 브라우저로 열기
cmd.exe /c start "" "C:\Users\SuperUser\Desktop\VibeCoding\Study-02\index.html"
```

## 파일 구조

```
index.html   — HTML 구조 (98줄)
style.css    — CSS 전체 (275줄)
script.js    — JavaScript 전체 (298줄)
CLAUDE.md    — 이 파일
```

## 데이터 모델

`localStorage` 키 `'todos'`에 JSON 배열로 저장.

```js
{
  id:        string,              // Date.now().toString(36) + random
  text:      string,              // 최대 80자
  category:  '업무' | '개인' | '공부',
  priority:  '높음' | '중간' | '낮음', // 기본값 '중간', 없으면 '중간'으로 fallback
  done:      boolean,
  createdAt: number,              // Unix ms
  dueDate:   string | null,       // 'YYYY-MM-DD' 형식
}
```

정렬 상태는 `'todoSort'` 키에 별도 저장. 가져오기 전 기존 데이터는 `'todos-backup'`에 백업된다.

## CSS 아키텍처

`:root`에 CSS 변수로 색상 시스템 정의. `@media (prefers-color-scheme: dark)`에서 변수만 재정의해 다크 모드 대응.

| 변수 | 라이트 | 다크 |
|---|---|---|
| `--color-primary` | `#2E5FA3` | `#5B8DD9` |
| `--color-success` | `#1D9E75` | `#2EBD8A` |
| `--color-danger`  | `#D85A30` | `#E8724A` |
| `--color-bg`      | `#F8F9FA` | `#1A1A2E` |
| `--color-card`    | `#FFFFFF` | `#16213E` |

## JS 구조 (섹션 순서, script.js)

```
// ── 상수 및 설정 ──    STORAGE_KEY, SORT_KEY, CAT_LABEL, FILTER_LABEL, PRIORITY_LABEL, PRIORITY_ORDER
// ── 데이터 처리 ──     loadTodos, saveTodos, generateId, formatDate, escapeHtml
// ── 상태 ──            todos, currentFilter, currentSort, dragSrcId, setTodos
// ── 렌더링 ──          getFilteredTodos, getSortedTodos, updateFilterCounts,
//                       updateStats, renderTodos
// ── CRUD ──            addTodo, startEdit, toggleTodo, deleteTodo, clearDone
// ── 내보내기/가져오기 ── exportTodos, importTodos
// ── 이벤트 핸들러 ──   (모두 아래쪽에 모아서 등록)
// ── 초기화 ──          formatDate(), sort-select.value, renderTodos(todos)
```

## 주요 설계 원칙

**렌더링 흐름** — 모든 변경은 반드시 이 순서를 따른다:
1. `setTodos(newList)` 호출 — 내부에서 `todos` 업데이트 + `saveTodos` 자동 실행
2. `renderTodos(todos)`

**이벤트 위임** — `#todo-list`에 단일 `click` 리스너를 달고 `e.target.closest('[data-action]')`으로 분기. 동적 생성 요소에도 작동한다.

**인라인 수정** — `startEdit(id, spanEl)` 은 `contentEditable='true'`로 전환 후 Enter/blur에서 저장, Escape에서 복원. `committed` 플래그로 Enter+blur 이중 저장을 방지한다.

**드래그 앤 드롭** — `currentSort === 'manual'`일 때만 `draggable="true"` 카드에 활성화. `dragstart/dragover/drop/dragend`를 `#todo-list`에 위임.

## 필터 키 값

| 버튼 텍스트 | `data-filter` |
|---|---|
| 전체 | `all` |
| 미완료 | `todo` |
| 완료 | `done` |
| 카테고리 | `'업무'` / `'개인'` / `'공부'` |

`getFilteredTodos(list, filter)` 의 `case` 와 일치해야 한다.

## 우선순위

`PRIORITY_LABEL` / `PRIORITY_ORDER` 상수로 관리.

| 값 | 표시 | 정렬 순서 | 라이트 배지 | 다크 배지 |
|---|---|---|---|---|
| `'높음'` | 🔴 높음 | 0 | 연빨강 | 어두운 빨강 |
| `'중간'` | 🟡 중간 | 1 | 연노랑 | 어두운 노랑 |
| `'낮음'` | 🔵 낮음 | 2 | 연회색 | 어두운 회색 |

- 입력 시 `#new-priority` select로 선택 (기본값: `'중간'`)
- 기존 데이터에 `priority` 필드가 없으면 렌더링/정렬 시 `'중간'`으로 fallback
- `getSortedTodos`의 `'priority'` case에서 `PRIORITY_ORDER`로 정렬

## 접근성

- `:focus-visible` 전역 스타일 (outline 2px solid var(--color-primary))
- 체크/수정/삭제 버튼에 `aria-label` 필수
- 수정 중 Escape → 편집 취소
