<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use Illuminate\Support\Facades\Storage;
class CoursesController extends Controller
{
	
	public function list()
    {
		return view('admin.content.courses.list',['courses' =>Course::orderBy('order', 'desc')->get()]);
    }
	
	public function new()
	{

		return view('admin.content.courses.new');
	}
	
	
	public function edit($id)
    {
		return view('admin.content.courses.edit',['course' =>Course::findOrFail($id)]);
    }
	
	
	public function update(Request $request,$id)
	{
	
		$course=Course::findOrFail($id);
		if (!$request->filled('name')) 
		 return back()->withErrors([
            'message' => 'You must set at least the name',
        ]);
		return $this->modify($request,$course);

		
	}
	
	
	public function create(Request $request)
	{
		if (!$request->filled('name')) 
		 return back()->withErrors([
            'message' => 'You must set at least the name',
        ]);
		$course=new Course;
		return $this->modify($request,$course);
	}
	
	private function modify(Request $request, $course)
	{
		
		if($request->filled('name'))
			$course->name=$request->input('name');
		if($request->filled('description'))
			$course->description=$request->input('description');
		if($request->filled('published'))
			$course->published=TRUE;
		else
		$course->published=FALSE;
		if($course->image==null)$course->image=Storage::url("blank128.png");
		if($request->hasFile('image'))
		{
			$path = $request->file('image')->store('public/courses');
			$course->image=Storage::url($path);
		}
		$course->save();

		 return redirect()->route('admin-view-courses');
	}


	public function delete(Request $request,$id)
	{	

		 Course::where('id', $id)->delete();

		 return redirect()->route('admin-view-courses');
	}




}
	
	
	
	
	
	

