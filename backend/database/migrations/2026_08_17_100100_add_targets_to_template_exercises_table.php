<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * 템플릿에 "몇 세트 몇 회"를 담을 자리.
 *
 * 지금 template_exercises에는 sort_order밖에 없다. 즉 템플릿은 종목의
 * 순서만 기억하고 처방은 기억하지 못한다. 사람이 만든 루틴이라면 본인이
 * 알고 있으니 넘어갈 수 있지만, 생성된 루틴은 "벤치 4세트 8회"가 본체다.
 * 담을 곳이 없으면 그 내용이 텍스트로만 남고 불러오기로 이어지지 않는다.
 *
 * 기존 행과 수동 템플릿을 위해 nullable로 둔다. 값이 없으면 지금과 똑같이
 * 동작한다.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('template_exercises', function (Blueprint $table) {
            $table->unsignedTinyInteger('target_sets')->nullable()->after('sort_order');
            $table->unsignedSmallInteger('target_reps')->nullable()->after('target_sets');
        });
    }

    public function down(): void
    {
        Schema::table('template_exercises', function (Blueprint $table) {
            $table->dropColumn(['target_sets', 'target_reps']);
        });
    }
};
