// 로그인·회원가입 두 화면이 같은 정규식을 각자 들고 있었다.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isEmail = (value) => EMAIL.test(String(value ?? ''))
