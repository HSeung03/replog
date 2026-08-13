<?php

/*
 * 이 프로젝트에는 웹 클라이언트가 없다. 모바일 앱은 전부 routes/api.php로
 * 들어오고, 구글 로그인도 id_token을 POST /api/auth/google로 보내는
 * 방식이다. 여기 있던 OAuth 리다이렉트/콜백 두 라우트는 아무도 부르지
 * 않으면서, env('FRONTEND_URL')을 config 밖에서 읽어 config:cache를 켜는
 * 순간 localhost:5174로 리다이렉트하는 경로였다.
 */
