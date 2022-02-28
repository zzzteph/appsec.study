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
use App\Models\Vm;
use App\Models\LabLessonQuestion;
use Illuminate\Support\Facades\Storage;
class LabLessonController extends Controller
{
	
	
	public function new($course_id,$topic_id)
    {
		return view('admin.content.course.topic.lesson.lab.new-lab-lesson',['course' =>Course::findOrFail($course_id),'topic' =>Topic::findOrFail($topic_id),'vms' =>Vm::all()]);
    }

	public function edit($course_id,$topic_id,$lesson_id)
    {
		return view('admin.content.course.topic.lesson.lab.edit-lab-lesson',['course' =>Course::findOrFail($course_id),'topic' =>Topic::findOrFail($topic_id),'vms' =>Vm::all(),'lesson' =>Lesson::findOrFail($lesson_id)]);
    }

	public function update(Request $request,$course_id,$topic_id,$lesson_id)
	{

		$validated = $request->validate([
			'name' => 'required',
			'lab_name' => 'required',
			'content' => 'required',
			'vm' => 'required'
		]);
				$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		$vm=Vm::findOrFail($request->input('vm'));
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
		$lesson->type='lab';
		
		$lesson->lab->name=$request->input('lab_name');
		$lesson->lab->content=$request->input('content');
		$lesson->lab->vm_id=$vm->id;
		$lesson->save();
		$lesson->lab->save();
			return redirect()->route('lessons', ['course_id' => $course->id,'topic_id' => $topic->id]);
		
		
	}

	public function create(Request $request,$course_id,$topic_id)
	{
		
		$validated = $request->validate([
			'name' => 'required',
			'lab_name' => 'required',
			'content' => 'required',
			'vm' => 'required'
		]);
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		$vm=Vm::findOrFail($request->input('vm'));
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
		$lesson->type='lab';
		$lesson->save();
		
		$labLesson=new LabLesson;
		$labLesson->name=$request->input('lab_name');
		$labLesson->content=$request->input('content');
		$labLesson->vm_id=$vm->id;

		$lesson->lab()->save($labLesson);
		
	
		return redirect()->route('lessons', ['course_id' => $course->id,'topic_id' => $topic->id]);
	}
	



}
	
	
	
	
	
	

