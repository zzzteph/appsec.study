<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\TheoryLesson;
use App\Models\LabLesson;
use App\Models\LabLessonQuestion;
use Illuminate\Support\Facades\Storage;
class LessonsController extends Controller
{
	
	public function list($course_id,$topic_id)
    {
		
		if(Auth::user()->admin)
		{
			$course = Course::findOrFail($course_id);
			$topic = Topic::findOrFail($topic_id);
			$lessons=Lesson::where('topic_id',$topic_id)->orderBy('order', 'asc')->get();
		}
		else
		{
			$course=Course::where('published', true)->findOrFail($course_id);
			$topic = Topic::where('published', true)->findOrFail($topic_id);
			$lessons = Lesson::where('published', true)->where('topic_id',$topic_id)->orderBy('order', 'asc')->get();
		}
		return view('content.lessons',['course' =>$course,'topic' =>$topic,'lessons' =>$lessons]);
    }
	
	
	
	public function view($course_id,$topic_id,$lesson_id)
	{	
	
		//lesson can be published , but course and topic can be not
	
		if(Auth::user()->admin)
		{
			$course = Course::findOrFail($course_id);
			$topic = Topic::findOrFail($topic_id);
			$lesson= Lesson::findOrFail($lesson_id);
		}
		else
		{
			$course=Course::where('published', true)->findOrFail($course_id);
			$topic = Topic::where('published', true)->findOrFail($topic_id);
			$lesson = Lesson::where('published', true)->findOrFail($lesson_id);
			if(!$lesson->is_opened)
			{
				  return back()->withErrors(['message' => 'You have no access to that lesson']);
			}
		}
		if($lesson->type=="lab")
		{
			return view('content.lesson.lab',['course' =>$course,'topic' =>$topic,'lesson' =>$lesson,'task'=>Auth::user()->current_user_lab_vm()]);
		}
		else if($lesson->type=="theory")
		{
			return view('content.lesson.theory',['course' =>$course,'topic' =>$topic,'lesson' =>$lesson]);
		}
		
	}



	public function delete(Request $request,$course_id,$topic_id,$lesson_id)
	{	

		 Lesson::findOrFail($lesson_id)->delete();
		 return redirect()->route('lessons', ['course_id' => $course_id,'topic_id' => $topic_id]);
	}

	public function decrease($course_id,$topic_id,$lesson_id)
	{
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		$lesson=Lesson::findOrFail($lesson_id);
		if($lesson->order>0)
		$lesson->order=$lesson->order-1;
		
		$lesson->save();
		return redirect()->route('lessons', ['course_id' => $course_id,'topic_id' => $topic_id]);
	}

	
	public function increase($course_id,$topic_id,$lesson_id)
	{
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		$lesson=Lesson::findOrFail($lesson_id);
		$lesson->order=$lesson->order+1;
		
		$lesson->save();
		return redirect()->route('lessons', ['course_id' => $course_id,'topic_id' => $topic_id]);
	}



}
	
	
	
	
	
	

