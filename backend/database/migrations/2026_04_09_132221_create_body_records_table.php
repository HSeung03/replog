<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('body_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('measured_at');              // 인바디 측정 날짜
            $table->decimal('weight', 5, 2);          // 몸무게 (kg)
            $table->decimal('muscle_mass', 5, 2);     // 근육량 (kg)
            $table->decimal('body_fat', 4, 2);        // 체지방률 (%)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('body_records');
    }
};
