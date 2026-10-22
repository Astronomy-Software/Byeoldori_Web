// 같은 화면에서 연달아 보낸 요청 중 마지막 요청의 응답만 반영하기 위한 순번표.
// begin()이 돌려준 함수는 그 뒤에 begin()이 다시 불리지 않았을 때만 true를 돌려준다.
export function createLatestRequest(): { begin(): () => boolean } {
  let seq = 0;
  return {
    begin() {
      const mine = ++seq;
      return () => mine === seq;
    },
  };
}
