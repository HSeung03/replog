<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * API 요청량 제한.
     *
     * Laravel 11부터 api 미들웨어 그룹의 기본 throttle이 빠졌기 때문에
     * bootstrap/app.php의 throttleApi()와 여기의 리미터 정의가 함께 있어야 한다.
     * (이름 붙은 리미터가 없으면 MissingRateLimiterException이 난다)
     */
    private function configureRateLimiting(): void
    {
        // 인증된 사용자는 계정 단위로 센다. 오프라인에서 쌓인 동기화 큐를
        // 한 번에 밀어 올리는 경우가 있어 분당 60회로는 빠듯하다.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // 로그인·회원가입·구글 로그인. 토큰을 발급하는 경로이므로 훨씬 좁게 잡는다.
        RateLimiter::for('auth', function (Request $request) {
            $limits = [
                // 같은 회선에서 계정을 갈아가며 시도하는 것을 막는다.
                // 모바일 통신사 NAT로 여러 사용자가 한 IP를 공유할 수 있어
                // 대화형 로그인 빈도보다는 넉넉하게 둔다.
                Limit::perMinute(20)->by('auth-ip:'.$request->ip()),
            ];

            // 특정 계정에 대한 비밀번호 대입을 막는다. IP를 키에 함께 넣어야
            // 공격자가 남의 이메일로 한도를 소진시켜 잠그는 것을 피할 수 있다.
            if ($email = Str::lower((string) $request->input('email'))) {
                $limits[] = Limit::perMinute(5)->by('auth-email:'.$email.'|'.$request->ip());
            }

            return $limits;
        });
    }
}
