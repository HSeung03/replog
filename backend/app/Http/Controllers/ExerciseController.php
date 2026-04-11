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
        if ($exercise->is_default || $exercise->user_id !== $request->user()->id) {
            return response()->json(['message' => '삭제할 수 없는 종목입니다.'], 403);
        }

        $exercise->delete();

        return response()->json(['message' => '삭제되었습니다.']);
    }
}
