<?php

namespace App\Http\Controllers\Web\Admin;
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
	
	
	public function new()
    {

		return view('admin.content.lessons.theory.new');
    }


	public function edit($id)
    {
		return view('admin.content.lessons.theory.edit',['lesson' =>Lesson::findOrFail($id)]);
    }

	public function update(Request $request,$id)
	{
		
		$validated = $request->validate([
			'name' => 'required',
			'content' => 'required'
		]);
		
		$lesson=Lesson::findOrFail($id);
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

		$lesson->type='theory';
		$lesson->theory->header=$request->input('name');
		$lesson->theory->content=$request->input('content');
		$lesson->theory->cancel=FALSE;
			if($request->filled('cancel'))
		$lesson->theory->cancel=TRUE;
		if($request->filled('score'))
		{
			$lesson->theory->score=$request->input('score');
		}
		$lesson->save();
		$lesson->theory->save();
		return redirect()->route('admin-view-lesson',['id' =>$lesson->id]);

		
		
	}

	public function create(Request $request)
	{

		$validated = $request->validate([
			'name' => 'required',
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

		$lesson->type='theory';
		$lesson->save();
		
		$theoryLesson=new TheoryLesson;
		$theoryLesson->header=$request->input('name');
		$theoryLesson->content=$request->input('content');
		$theoryLesson->cancel=FALSE;
			if($request->filled('cancel'))
		$theoryLesson->cancel=TRUE;
		
		
		if($request->filled('score'))
		{
			$theoryLesson->score=$request->input('score');
		}
		$lesson->theory()->save($theoryLesson);
		
	
	return redirect()->route('admin-view-lesson',['id' =>$lesson->id]);
	}
	



}
	
	
	
	
	
	

