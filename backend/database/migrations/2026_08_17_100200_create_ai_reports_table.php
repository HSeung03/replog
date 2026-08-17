<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * 모델이 만들어 낸 결과물(요약·식단·루틴)을 담아 둔다.
 *
 * 테이블이 필요한 이유는 두 가지다.
 *   1. 호출이 느리고 돈이 든다. 화면을 열 때마다 다시 부르면 안 되므로
 *      결과를 남겨 두고 다시 보여 준다.
 *   2. 응답이 수십 초까지 가면 PHP-FPM 동기 요청으로는 타임아웃이 난다.
 *      큐로 넘기려면 "요청은 접수됐고 아직 안 끝났다"를 담을 상태가 있어야 한다.
 *
 * type별로 테이블을 나누지 않은 이유: 셋 다 사용자 + 생성시각 + 본문 +
 * 호출 메타로 모양이 같다. 본문 형태가 굳으면 그때 나눠도 늦지 않다.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->string('type');                 // summary, diet, routine
            $table->string('status')->default('pending'); // pending, done, failed

            // 본문. 아직 모양이 확정되지 않았고 type마다 다르므로 json으로 둔다.
            $table->json('content')->nullable();
            $table->text('error')->nullable();      // status=failed일 때 사유

            // 어떤 입력으로 만든 결과인지. 기간이 다르면 다른 결과다.
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();

            // 호출 메타. 모델을 바꿨을 때 결과가 달라진 이유를 추적하고,
            // 토큰으로 비용을 본다.
            $table->string('model')->nullable();
            $table->unsignedInteger('input_tokens')->nullable();
            $table->unsignedInteger('output_tokens')->nullable();

            $table->timestamps();

            // "이 사용자의 최근 요약" 조회가 주 패턴이다.
            $table->index(['user_id', 'type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_reports');
    }
};
