## GIF Editor

### 라이브 데모
- 데모: [https://gif-editor.vercel.app/](https://gif-editor.vercel.app/)

### 현재 구현된 기능
- MP4 등의 비디오 파일을 GIF로 변환하기
- **GIF 리사이즈**: 업로드한 GIF 파일을 원하는 크기로 리사이즈
  - 비율 유지 옵션
  - 빠른 설정 프리셋 (25%, 50%, 75%, 100%)
  - 실시간 미리보기
  - 파일 크기 정보 표시

### 추후 계획
- GIF 편집 기능 (Crop, Progress bar 등등)

### 특징
- WebAssembly 기반으로 정적 페이지에서 서버리스로 동작
- 모든 작업이 로컬에서 이뤄지므로 파일을 서버에 업로드할 필요가 없음

### 사용 기술

[![Tech Stack](https://skillicons.dev/icons?i=ts,react,vite,wasm,rust,tailwind,vercel&theme=dark)](https://skillicons.dev)