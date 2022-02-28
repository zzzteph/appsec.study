<?php

namespace App\Http\Controllers\Api;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Vm;
use App\Models\UserCloudVm;
use App\Models\UserToolVm;
use App\Models\LabLessonQuestion;
use Illuminate\Support\Facades\Storage;
class TaskController extends Controller
{
	
	

	public function get($id)
    {
		if(is_null(Auth::user()->id))
		{
			return response()->json("False",404);
		}
		$cloudVM=UserCloudVm::where('user_id',Auth::user()->id)->where('id', $id)->where('status', '!=','terminated')->first();
		if($cloudVM==null)
			return response()->json("False",404);
		return $cloudVM;
    }
	public function tool()
    {
		if(is_null(Auth::user()->id))
		{
			return response()->json("False",404);
		}
		$toolsVm=UserToolVm::where('user_id',Auth::user()->id)->where('status', '!=','terminated')->first();
		if($toolsVm==null)
			return response()->json("False",404);
		return $toolsVm;
    }

	
	

}
	
	
	
	
	
	

