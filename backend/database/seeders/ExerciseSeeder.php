<?php

namespace Database\Seeders;

use App\Models\Exercise;
use Illuminate\Database\Seeder;

class ExerciseSeeder extends Seeder
{
    public function run(): void
    {
        $exercises = [
            ['name' => '벤치프레스',       'category' => '가슴'],
            ['name' => '인클라인 벤치프레스', 'category' => '가슴'],
            ['name' => '디클라인 벤치프레스', 'category' => '가슴'],
            ['name' => '덤벨 플라이',       'category' => '가슴'],
            ['name' => '케이블 크로스오버', 'category' => '가슴'],
            ['name' => '딥스',             'category' => '가슴'],

            ['name' => '데드리프트',        'category' => '등'],
            ['name' => '랫 풀다운',         'category' => '등'],
            ['name' => '바벨 로우',         'category' => '등'],
            ['name' => '시티드 케이블 로우', 'category' => '등'],
            ['name' => '원암 덤벨 로우',    'category' => '등'],
            ['name' => '풀업',             'category' => '등'],

            ['name' => '스쿼트',           'category' => '하체'],
            ['name' => '레그 프레스',       'category' => '하체'],
            ['name' => '레그 익스텐션',     'category' => '하체'],
            ['name' => '레그 컬',          'category' => '하체'],
            ['name' => '런지',             'category' => '하체'],
            ['name' => '카프 레이즈',       'category' => '하체'],

            ['name' => '오버헤드 프레스',   'category' => '어깨'],
            ['name' => '사이드 레터럴 레이즈', 'category' => '어깨'],
            ['name' => '프론트 레이즈',     'category' => '어깨'],
            ['name' => '리어 델트 플라이',  'category' => '어깨'],
            ['name' => '페이스 풀',        'category' => '어깨'],

            ['name' => '바벨 컬',          'category' => '팔'],
            ['name' => '덤벨 컬',          'category' => '팔'],
            ['name' => '해머 컬',          'category' => '팔'],
            ['name' => '트라이셉스 푸시다운', 'category' => '팔'],
            ['name' => '오버헤드 트라이셉스 익스텐션', 'category' => '팔'],

            ['name' => '러닝머신',         'category' => '유산소'],
            ['name' => '자전거',           'category' => '유산소'],
            ['name' => '로잉머신',         'category' => '유산소'],
            ['name' => '줄넘기',           'category' => '유산소'],
        ];

        foreach ($exercises as $data) {
            Exercise::updateOrCreate(
                ['name' => $data['name'], 'is_default' => true, 'user_id' => null],
                ['category' => $data['category']]
            );
        }
    }
}
