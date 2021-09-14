<?php

namespace App\Http\Controllers\Web\Admin;
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
		$course=Course::findOrFail($course_id);
		$topics=Topic::where('course_id', $course_id)->orderBy('order', 'asc')->get();

		return view('admin.content.topics.list',['course'=>$course,'topics'=>$topics]);
    }
	
	public function new($course_id)
    {
		return view('admin.content.topics.new',['course' =>Course::findOrFail($course_id)]);
    }
	
	
	
	public function edit($course_id,$topic_id)
    {
		return view('admin.content.topics.edit',['course' =>Course::findOrFail($course_id),'topic' =>Topic::findOrFail($topic_id)]);
    }
	
	
	public function update(Request $request,$course_id,$topic_id)
	{
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		if (!$request->filled('name')) 
		 return back()->withErrors([
            'message' => 'You must set at least the name',
        ]);

				return $this->modify($request,$course,$topic);

	}
	
	
	public function create(Request $request,$course_id)
	{
		$course=Course::findOrFail($course_id);
		if (!$request->filled('name')) 
		 return back()->withErrors([
            'message' => 'You must set at least the name',
        ]);
		$topic=new Topic;
		return $this->modify($request,$course,$topic);
	}
	
	private function modify(Request $request, $course,$topic)
	{
		
		if($request->filled('name'))
			$topic->name=$request->input('name');
		if($request->filled('description'))
			$topic->description=$request->input('description');
		if($request->filled('published'))
			$topic->published=TRUE;
		else
		$topic->published=FALSE;
		$topic->course_id=$course->id;
		$topic->save();
		return redirect()->route('admin-list-topics', ['course_id' => $course->id]);

	}


	public function delete(Request $request,$course_id,$topic_id)
	{	
		Course::findOrFail($course_id);
		 Topic::where('id', $topic_id)->delete();
		return redirect()->route('admin-list-topics', ['course_id' => $course_id]);
	}

	
	
	public function decrease($course_id,$topic_id)
	{
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		if($topic->order>0)
		$topic->order=$topic->order-1;
		
		$topic->save();
		return redirect()->route('admin-list-topics', ['course_id' => $course_id]);
	}

	
	public function increase($course_id,$topic_id)
	{
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		$topic->order=$topic->order+1;
		
		$topic->save();
		return redirect()->route('admin-list-topics', ['course_id' => $course_id]);
	}

}
	
	
	
	
	
	

