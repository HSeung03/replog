<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * 사용자의 신체 스펙과 목표.
 *
 * users에 컬럼을 더하지 않고 따로 뺀 이유가 둘 있다.
 *   1. users는 매 요청 auth:sanctum이 통째로 읽어 오는 테이블이다. 인증에
 *      쓰지 않는 컬럼을 붙이면 모든 요청이 같이 끌고 다닌다.
 *   2. 전부 nullable로 users에 붙이면 "프로필을 아직 안 쓴 사람"과 "쓰다 만
 *      사람"을 구분할 방법이 없다. 행이 있느냐로 판별하는 편이 명확하다.
 *      (구글 로그인은 이름과 이메일만 받으므로 가입 직후엔 항상 비어 있다)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            // unique = 사용자당 한 행. 프로필은 시계열이 아니다(그건 body_records).
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');

            // 나이가 아니라 생년월일을 저장한다. 나이를 넣으면 해가 바뀔 때마다
            // 틀려지는데 고쳐 줄 주체가 없다.
            $table->date('birth_date')->nullable();
            $table->string('gender')->nullable();            // male, female, other
            $table->decimal('height', 5, 2)->nullable();     // cm. body_records에 없어서 BMI/BMR을 못 냈다.

            $table->string('goal')->nullable();              // lose_fat, maintain, gain_muscle, strength
            $table->string('activity_level')->nullable();    // sedentary, light, moderate, active, very_active
            $table->string('experience_level')->nullable();  // beginner, intermediate, advanced

            // 루틴을 며칠로 쪼갤지 정하는 값. 이게 없으면 5분할을 주 2회 나오는
            // 사람에게 들이밀게 된다.
            $table->unsignedTinyInteger('weekly_workout_days')->nullable();

            // 알러지·채식·종교적 제한 등. 자유 문자열 배열이라 컬럼으로 못 박지 않는다.
            $table->json('dietary_restrictions')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
