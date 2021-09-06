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
use App\Models\UserLesson;
use Illuminate\Support\Facades\Storage;
class TheoryLessonController extends Controller
{
	
	
	public function new($course_id,$topic_id)
    {
		return view('admin.content.course.topic.lesson.theory.new-theory-lesson',['course' =>Course::findOrFail($course_id),'topic' =>Topic::findOrFail($topic_id)]);
    }


	public function mark_as_done($course_id,$topic_id,$lesson_id)
    {
		//check if userLesson exist
		$lesson=Lesson::findOrFail($lesson_id);
		if(!$lesson->is_opened)
		{
			  return back()->withErrors(['message' => 'You have no access to that lesson']);
		}
		$userLesson=UserLesson::where('user_id',Auth::user()->id)->where('lesson_id',$lesson_id)->first();
		if($userLesson==null)
		{
			$userLesson=new UserLesson;
			$userLesson->lesson_id=$lesson_id;
			$userLesson->user_id=Auth::user()->id;
			
		}
		$userLesson->status='done';
		$userLesson->save();
			return redirect()->route('view-lesson', ['course_id' => $course_id,'topic_id' => $topic_id,'lesson_id' => $lesson_id]);
    }





	public function edit($course_id,$topic_id,$lesson_id)
    {
		return view('admin.content.course.topic.lesson.theory.edit-theory-lesson',['course' =>Course::findOrFail($course_id),'topic' =>Topic::findOrFail($topic_id),'lesson' =>Lesson::findOrFail($lesson_id)]);
    }

	public function update(Request $request,$course_id,$topic_id,$lesson_id)
	{
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		$validated = $request->validate([
			'name' => 'required',
			'header' => 'required',
			'content' => 'required'
		]);
		
		$lesson=Lesson::findOrFail($lesson_id);
		if($request->filled('name'))
			$lesson->name=$request->input('name');
		if($request->filled('description'))
		{
			$lesson->description=$request->input('description');
		}
		else
		{
			$lesson->description="";
		}
		if($request->filled('published'))
			$lesson->published=TRUE;
		else
			$lesson->published=FALSE;
		$lesson->topic_id=$topic->id;
		$lesson->type='theory';
		
		$lesson->theory->header=$request->input('header');
		$lesson->theory->content=$request->input('content');
		if($request->filled('score'))
		{
			$lesson->theory->score=$request->input('score');
		}
		$lesson->save();
		$lesson->theory->save();
			return redirect()->route('lessons', ['course_id' => $course->id,'topic_id' => $topic->id]);
		
		
	}

	public function create(Request $request,$course_id,$topic_id)
	{
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		$validated = $request->validate([
			'name' => 'required',
			'header' => 'required',
			'content' => 'required'
		]);
		
		$lesson=new Lesson;
		if($request->filled('name'))
			$lesson->name=$request->input('name');
		if($request->filled('description'))
		{
			$lesson->description=$request->input('description');
		}
		else
		{
			$lesson->description="";
		}
		if($request->filled('published'))
			$lesson->published=TRUE;
		else
			$lesson->published=FALSE;
		$lesson->topic_id=$topic->id;
		$lesson->type='theory';
		$lesson->save();
		
		$theoryLesson=new TheoryLesson;
		$theoryLesson->header=$request->input('header');
		$theoryLesson->content=$request->input('content');
		if($request->filled('score'))
		{
			$theoryLesson->score=$request->input('score');
		}
		$lesson->theory()->save($theoryLesson);
		
	
	return redirect()->route('lessons', ['course_id' => $course->id,'topic_id' => $topic->id]);
	}
	



}
	
	
	
	
	
	

