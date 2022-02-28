<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\TheoryLesson;
use App\Models\LabLesson;
use App\Models\LabLessonQuestion;
use Illuminate\Support\Facades\Storage;
class LessonsController extends Controller
{
	
	public function list()
    {
		return view('admin.content.lessons.list',['lessons' =>Lesson::orderBy('id', 'desc')->paginate(10)]);
    }

	public function view($id)
	{	
		$lesson= Lesson::findOrFail($id);
		if($lesson->type=="lab")
		{
			return view('admin.content.lessons.lab.index',['lesson' =>$lesson,'task'=>Auth::user()->current_user_lab_vm()]);
		}
		else if($lesson->type=="theory")
		{
			return view('admin.content.lessons.theory.index',['lesson' =>$lesson]);
		}
		
	}
	public function delete(Request $request,$id)
	{	
		 Lesson::findOrFail($id)->delete();
		 return redirect()->route('admin-view-lessons');
	}

}
	
	
	
	
	
	

