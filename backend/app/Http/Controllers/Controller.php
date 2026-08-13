<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    /*
     * 소유권 검사가 컨트롤러마다 복붙되어 있었다(11회). 게다가 어떤 곳은
     * 느슨한 !=, 어떤 곳은 엄격한 !==를 써서 기준도 갈렸고, 한 곳만 빠뜨리면
     * 그대로 IDOR이 됐다. App\Policies로 옮기고 여기서 authorize()를 연다.
     */
    use AuthorizesRequests;
}
