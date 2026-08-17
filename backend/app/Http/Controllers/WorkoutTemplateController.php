<?php

namespace App\Http\Controllers;

use App\Http\Resources\WorkoutTemplateResource;
use App\Models\Exercise;
use App\Models\WorkoutTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkoutTemplateController extends Controller
{
    /*
     * exercises 배열을 belongsToMany::sync()가 받는 형태로 바꾼다.
     * [['exercise_id' => 3], ...] → [3 => ['sort_order' => 1], ...]
     *
     * 같은 종목이 두 번 들어오면 키가 겹쳐 하나로 합쳐진다. 원래도 한 템플릿에
     * 같은 종목을 두 번 담을 이유가 없고, 이전 구현은 중복 행을 그대로 만들었다.
     */
    private function pivotPayload(array $exercises): array
    {
        $payload = [];

        foreach (array_values($exercises) as $index => $item) {
            $payload[$item['exercise_id']] = [
                'sort_order'  => $index + 1,
                // 수동으로 만든 템플릿은 처방 없이 종목만 담는다. 그때는 null로 남는다.
                'target_sets' => $item['target_sets'] ?? null,
                'target_reps' => $item['target_reps'] ?? null,
            ];
        }

        return $payload;
    }

    // 내 템플릿 목록
    public function index(Request $request)
    {
        $templates = WorkoutTemplate::with('exercises')
            ->where('user_id', $request->user()->id)
            ->get();

        return response()->json(WorkoutTemplateResource::collection($templates));
    }

    // 템플릿 생성
    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'exercises'  => 'array',
            'exercises.*.exercise_id' => ['required', Exercise::accessibleRule($request->user()->id)],
            'exercises.*.target_sets' => 'nullable|integer|min:1|max:255',
            'exercises.*.target_reps' => 'nullable|integer|min:1|max:1000',
        ]);

        // 템플릿만 만들어지고 종목은 비어 있는 상태로 남지 않도록 한 트랜잭션에 묶는다.
        $template = DB::transaction(function () use ($request) {
            $template = WorkoutTemplate::create([
                'user_id' => $request->user()->id,
                'name'    => $request->name,
            ]);

            $template->exercises()->sync($this->pivotPayload($request->exercises ?? []));

            return $template;
        });

        return response()->json(WorkoutTemplateResource::make($template->load('exercises')), 201);
    }

    // 템플릿 상세 조회
    public function show(Request $request, WorkoutTemplate $workoutTemplate)
    {
        $this->authorize('view', $workoutTemplate);

        return response()->json(WorkoutTemplateResource::make($workoutTemplate->load('exercises')));
    }

    // 템플릿 수정 (이름 + 종목 목록 교체)
    public function update(Request $request, WorkoutTemplate $workoutTemplate)
    {
        $this->authorize('update', $workoutTemplate);

        $request->validate([
            'name'       => 'sometimes|string|max:255',
            'exercises'  => 'array',
            'exercises.*.exercise_id' => ['required', Exercise::accessibleRule($request->user()->id)],
            'exercises.*.target_sets' => 'nullable|integer|min:1|max:255',
            'exercises.*.target_reps' => 'nullable|integer|min:1|max:1000',
        ]);

        // 이전에는 전체 삭제 후 루프로 재등록했다. 루프 중간에 예외가 나면
        // 템플릿의 종목이 전부 사라진 채로 남았고 되돌릴 지점이 없었다.
        // sync()는 차이만 반영하고, 트랜잭션이 중간 실패를 되돌린다.
        DB::transaction(function () use ($request, $workoutTemplate) {
            if ($request->has('name')) {
                $workoutTemplate->update(['name' => $request->name]);
            }

            if ($request->has('exercises')) {
                $workoutTemplate->exercises()->sync($this->pivotPayload($request->exercises));
            }
        });

        return response()->json(WorkoutTemplateResource::make($workoutTemplate->load('exercises')));
    }

    // 템플릿 삭제
    public function destroy(Request $request, WorkoutTemplate $workoutTemplate)
    {
        $this->authorize('delete', $workoutTemplate);

        $workoutTemplate->delete();

        return response()->json(['message' => '삭제되었습니다.']);
    }
}
