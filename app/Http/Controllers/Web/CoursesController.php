<?php

namespace App\Http\Controllers\Web;
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
		
		if(Auth::user()->admin)
		{
			$courses = Course::orderBy('order', 'desc')->get();
		}
		else
			$courses = Course::where('published', true)->orderBy('order', 'desc')->get();
		return view('content.courses',['courses' =>$courses]);
    }
	
	public function new()
	{

		return view('admin.content.course.new');
	}
	
	
	public function edit($course_id)
    {
		return view('admin.content.course.edit',['course' =>Course::findOrFail($course_id)]);
    }
	
	
	public function update(Request $request,$course_id)
	{
	
		$course=Course::findOrFail($course_id);
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

		return redirect()->intended('courses');
	}


	public function delete(Request $request,$course_id)
	{	

		 Course::where('id', $course_id)->delete();

		 return redirect()->intended('courses');
	}




}
	
	
	
	
	
	

