<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use Illuminate\Support\Facades\Storage;
class TopicsController extends Controller
{
	
	public function list($course_id)
    {

		if(Auth::user()->admin)
		{
			$course=Course::findOrFail($course_id);
			$topics=Topic::where('course_id', $course_id)->orderBy('order', 'asc')->get();
		}
		else
		{
			$course=Course::where('published', true)->findOrFail($course_id);
			$topics=Topic::where('published', true)->where('course_id', $course_id)->orderBy('order', 'asc')->get();
		}



		
		return view('content.topics',['course'=>$course,'topics'=>$topics]);
    }

}
	
	
	
	
	
	

