<?php

namespace App\Http\Controllers;

use App\Models\TemplateExercise;
use App\Models\WorkoutTemplate;
use Illuminate\Http\Request;

class WorkoutTemplateController extends Controller
{
    // 내 템플릿 목록
    public function index(Request $request)
    {
        $templates = WorkoutTemplate::with('exercises')
            ->where('user_id', $request->user()->id)
            ->get();

        return response()->json($templates);
    }

    // 템플릿 생성
    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'exercises'  => 'array',
            'exercises.*.exercise_id' => 'required|exists:exercises,id',
        ]);

        $template = WorkoutTemplate::create([
            'user_id' => $request->user()->id,
            'name'    => $request->name,
        ]);

        foreach ($request->exercises ?? [] as $index => $item) {
            TemplateExercise::create([
                'template_id' => $template->id,
                'exercise_id' => $item['exercise_id'],
                'sort_order'  => $index + 1,
            ]);
        }

        return response()->json($template->load('exercises'), 201);
    }

    // 템플릿 상세 조회
    public function show(Request $request, WorkoutTemplate $workoutTemplate)
    {
        if ($workoutTemplate->user_id !== $request->user()->id) {
            return response()->json(['message' => '권한이 없습니다.'], 403);
        }

        return response()->json($workoutTemplate->load('exercises'));
    }

    // 템플릿 수정 (이름 + 종목 목록 교체)
    public function update(Request $request, WorkoutTemplate $workoutTemplate)
    {
        if ($workoutTemplate->user_id !== $request->user()->id) {
            return response()->json(['message' => '권한이 없습니다.'], 403);
        }

        $request->validate([
            'name'       => 'sometimes|string|max:255',
            'exercises'  => 'array',
            'exercises.*.exercise_id' => 'required|exists:exercises,id',
        ]);

        if ($request->has('name')) {
            $workoutTemplate->update(['name' => $request->name]);
        }

        if ($request->has('exercises')) {
            // 기존 종목 삭제 후 재등록
            TemplateExercise::where('template_id', $workoutTemplate->id)->delete();
            foreach ($request->exercises as $index => $item) {
                TemplateExercise::create([
                    'template_id' => $workoutTemplate->id,
                    'exercise_id' => $item['exercise_id'],
                    'sort_order'  => $index + 1,
                ]);
            }
        }

        return response()->json($workoutTemplate->load('exercises'));
    }

    // 템플릿 삭제
    public function destroy(Request $request, WorkoutTemplate $workoutTemplate)
    {
        if ($workoutTemplate->user_id !== $request->user()->id) {
            return response()->json(['message' => '권한이 없습니다.'], 403);
        }

        $workoutTemplate->delete();

        return response()->json(['message' => '삭제되었습니다.']);
    }
}
