# 할 일 관리 앱

순수 Vanilla JavaScript(ES6+)로 만든 개인용 할 일 관리 앱.
빌드 도구 없이 `index.html` 단일 파일로 완결됩니다.

## 실행

```bash
# 파일을 브라우저에서 직접 열기
start index.html
```

서버 설정이나 패키지 설치가 필요 없습니다.

## 기능

| 기능 | 설명 |
|---|---|
| 할 일 추가 | 텍스트 입력 + 카테고리 선택, Enter 또는 버튼 클릭 |
| 인라인 수정 | 텍스트 클릭 → contentEditable 전환, Enter 저장 / Escape 취소 |
| 완료 토글 | 원형 체크 버튼, 완료 시 취소선 + opacity 감소 |
| 삭제 | confirm 확인 후 제거 |
| 완료 일괄 삭제 | 완료 항목이 있을 때 버튼 표시 |
| 필터 | 전체 / 미완료 / 완료 / 💼업무 / 🏠개인 / 📚공부 |
| 정렬 | 생성일순 / 카테고리순 / 완료 상태순 / 수동(드래그 앤 드롭) |
| 내보내기 | JSON 파일 다운로드 |
| 가져오기 | JSON 파일 업로드, 기존 데이터 자동 백업 |
| 통계 | 전체 / 완료 / 미완료 카드 + 진행률 프로그레스 바 |
| 다크 모드 | `prefers-color-scheme: dark` 자동 감지 |

## 스크린샷

| 라이트 모드 | 다크 모드 |
|---|---|
| ![light](https://github.com/user-attachments/assets/placeholder-light) | ![dark](https://github.com/user-attachments/assets/placeholder-dark) |

> 스크린샷은 추후 업데이트 예정입니다.

## 기술 스택

- HTML5 / CSS3 / Vanilla JavaScript (ES6+)
- 데이터 저장: `localStorage`
- 외부 라이브러리 없음, 빌드 도구 없음

## 데이터 구조

`localStorage` 키 `todos`에 JSON 배열로 저장됩니다.

```js
{
  id:        string,   // 고유 식별자
  text:      string,   // 할 일 내용 (최대 80자)
  category:  '업무' | '개인' | '공부',
  done:      boolean,
  createdAt: number,   // Unix timestamp (ms)
}
```

## 파일 구조

```
index.html   — 앱 전체 (CSS + HTML + JS)
README.md    — 이 파일
CLAUDE.md    — Claude Code 작업 가이드
```

## 라이선스

MIT
