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
use App\Models\Vm;
use App\Models\LabLessonQuestion;
use Illuminate\Support\Facades\Storage;
class LabLessonController extends Controller
{
	
	
	public function new()
    {
		return view('admin.content.lessons.lab.new',['vms' =>Vm::all()]);
    }

	public function edit($id)
    {
		return view('admin.content.lessons.lab.edit',['vms' =>Vm::all(),'lesson' =>Lesson::findOrFail($id)]);
    }

	public function update(Request $request,$id)
	{

		$validated = $request->validate([
			'name' => 'required',
			'content' => 'required',
			'vm' => 'required'
		]);

		$vm=Vm::findOrFail($request->input('vm'));
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
		
		$lesson->type='lab';
		
		$lesson->lab->name=$request->input('name');
		$lesson->lab->content=$request->input('content');
		$lesson->lab->vm_id=$vm->id;
		$lesson->save();
		$lesson->lab->save();
		return redirect()->route('admin-edit-lab-lesson',['id' =>$lesson->id]);	 
		
	}

	public function create(Request $request)
	{
		
		$validated = $request->validate([
			'name' => 'required',
			'content' => 'required',
			'vm' => 'required'
		]);

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

		$lesson->type='lab';
		$lesson->save();
		
		$labLesson=new LabLesson;
		$labLesson->name=$request->input('name');
		$labLesson->content=$request->input('content');
		$labLesson->vm_id=$vm->id;

		$lesson->lab()->save($labLesson);
		
	
		return redirect()->route('admin-edit-lab-lesson',['id' =>$lesson->id]);
	}
	



}
	
	
	
	
	
	

