<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect'      => env('GOOGLE_REDIRECT_URI'),

        /*
         * 모바일에서 넘어온 id_token의 aud로 허용할 클라이언트 ID 목록.
         * 발급 주체가 플랫폼마다 다르므로 둘 다 필요하다.
         *   - iOS:     iosClientId로 발급
         *   - Android: webClientId(serverClientId)로 발급
         * 이 목록에 없는 aud를 허용하면 아무 구글 앱의 id_token으로도
         * 로그인이 통과하므로, 비어 있으면 로그인을 거부한다.
         * (client ID는 비밀값이 아니라 공개 식별자이므로 기본값으로 둔다)
         */
        'allowed_audiences' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env(
                'GOOGLE_ALLOWED_AUDIENCES',
                '233986109518-cqhebgq5knmkqqil53fvg23ssdd80qjt.apps.googleusercontent.com,'
                .'233986109518-0qdfufi0hbimij82u8pifulsvb5k7a5f.apps.googleusercontent.com'
            ))
        ))),
    ],

];
