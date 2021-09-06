<?php

namespace App\Http\Controllers\Api;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\TheoryLesson;
use App\Models\LabLesson;
use App\Models\Vm;
use App\Models\LabLessonQuestion;
use Illuminate\Support\Facades\Storage;
class TaskController extends Controller
{
	
	

	public function get()
    {
		if(is_null(Auth::user()->current_user_lab_vm()))
		{
			return response()->json("False",404);
		}

		return response()->json(Auth::user()->current_user_lab_vm(),200);
		
    }

	

}
	
	
	
	
	
	

