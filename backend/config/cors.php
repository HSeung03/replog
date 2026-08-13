<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    /*
     * 기본값을 '*'로 두면 FRONTEND_URL이 비었을 때 모든 오리진이 열린다.
     * 지금은 Bearer 토큰 인증에 supports_credentials가 false라 당장 큰
     * 문제는 아니지만, 빠뜨렸을 때 안전한 쪽으로 기울어야 한다.
     * 웹 클라이언트가 생기면 FRONTEND_URL을 채워 넣는다.
     */
    'allowed_origins' => array_values(array_filter([env('FRONTEND_URL')])),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
