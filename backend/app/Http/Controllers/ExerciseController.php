<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use Illuminate\Http\Request;

class ExerciseController extends Controller
{
    // 종목 목록 (기본 종목 + 내 커스텀 종목)
    public function index(Request $request)
    {
        $exercises = Exercise::where('is_default', true)
            ->orWhere('user_id', $request->user()->id)
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return response()->json($exercises);
    }

    // 커스텀 종목 추가
    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'category' => 'required|in:가슴,등,하체,어깨,팔,유산소',
        ]);

        $exercise = Exercise::create([
            'name'       => $request->name,
            'category'   => $request->category,
            'is_default' => false,
            'user_id'    => $request->user()->id,
        ]);

        return response()->json($exercise, 201);
    }

    // 커스텀 종목 삭제 (본인 종목만)
    public function destroy(Request $request, Exercise $exercise)
    {
        if ($exercise->is_default || $exercise->user_id != $request->user()->id) {
            return response()->json(['message' => '삭제할 수 없는 종목입니다.'], 403);
        }

        // exercises를 지우면 FK cascade로 이 종목의 세트가 날짜를 가리지 않고
        // 전부 삭제된다. 되돌릴 수 없으므로 규모를 알려주고 동의를 받은
        // 경우에만(force) 진행한다.
        $setsCount      = $exercise->workoutSets()->count();
        $templatesCount = $exercise->templates()->count();

        if (($setsCount > 0 || $templatesCount > 0) && !$request->boolean('force')) {
            return response()->json([
                'message'         => '이 종목으로 기록한 내용이 함께 삭제됩니다.',
                'sets_count'      => $setsCount,
                'templates_count' => $templatesCount,
            ], 409);
        }

        $exercise->delete();

        return response()->json([
            'message'            => '삭제되었습니다.',
            'deleted_sets_count' => $setsCount,
        ]);
    }
}
