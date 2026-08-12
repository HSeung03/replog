<?php

namespace App\Http\Controllers;

use App\Models\BodyRecord;
use Illuminate\Http\Request;

class BodyRecordController extends Controller
{
    /*
     * body_records 컬럼이 담을 수 있는 상한.
     * body_fat은 decimal(4,2)라 99.99가 한계인데 기존 규칙은 max:100이었다.
     * 즉 검증이 허용하는 100을 정작 저장할 수 없어 MySQL에서 500이 났다.
     */
    private const MAX_WEIGHT      = 999.99; // decimal(5, 2)
    private const MAX_MUSCLE_MASS = 999.99; // decimal(5, 2)
    private const MAX_BODY_FAT    = 99.99;  // decimal(4, 2)

    // 전체 기록 조회 (그래프용)
    public function index(Request $request)
    {
        $records = BodyRecord::where('user_id', $request->user()->id)
            ->orderBy('measured_at')
            ->get();

        return response()->json($records);
    }

    // 기록 추가
    public function store(Request $request)
    {
        $request->validate([
            'measured_at' => 'required|date',
            'weight'      => 'required|numeric|min:0|max:'.self::MAX_WEIGHT,
            'muscle_mass' => 'required|numeric|min:0|max:'.self::MAX_MUSCLE_MASS,
            'body_fat'    => 'required|numeric|min:0|max:'.self::MAX_BODY_FAT,
        ]);

        $record = BodyRecord::create([
            'user_id'     => $request->user()->id,
            'measured_at' => $request->measured_at,
            'weight'      => $request->weight,
            'muscle_mass' => $request->muscle_mass,
            'body_fat'    => $request->body_fat,
        ]);

        return response()->json($record, 201);
    }

    // 기록 수정
    public function update(Request $request, BodyRecord $bodyRecord)
    {
        if ($bodyRecord->user_id !== $request->user()->id) {
            return response()->json(['message' => '권한이 없습니다.'], 403);
        }

        $request->validate([
            'measured_at' => 'sometimes|date',
            'weight'      => 'sometimes|numeric|min:0|max:'.self::MAX_WEIGHT,
            'muscle_mass' => 'sometimes|numeric|min:0|max:'.self::MAX_MUSCLE_MASS,
            'body_fat'    => 'sometimes|numeric|min:0|max:'.self::MAX_BODY_FAT,
        ]);

        $bodyRecord->update($request->only('measured_at', 'weight', 'muscle_mass', 'body_fat'));

        return response()->json($bodyRecord);
    }

    // 기록 삭제
    public function destroy(Request $request, BodyRecord $bodyRecord)
    {
        if ($bodyRecord->user_id !== $request->user()->id) {
            return response()->json(['message' => '권한이 없습니다.'], 403);
        }

        $bodyRecord->delete();

        return response()->json(['message' => '삭제되었습니다.']);
    }
}
