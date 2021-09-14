<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\TopicNode;
use Illuminate\Support\Facades\Storage;
class NodesController extends Controller
{
	
	public function get($course_id,$topic_id)
    {

		return view('admin.content.topics.nodes',['lessons'=>Lesson::all(),'course' =>Course::findOrFail($course_id),'topic' =>Topic::findOrFail($topic_id),'nodes'=>TopicNode::where('topic_id', $topic_id)->get()]);
    }
	
	public function update(Request $request,$course_id,$topic_id)
    {
		
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		if (!$request->filled('nodes') || !$request->filled('routes')) 
		 return back()->withErrors([
            'message' => 'You must set nodes and routes!',
        ]);
		
		return view('admin.content.topics.new',['course' =>Course::findOrFail($course_id)]);
    }
	
	
	

}
	
	
	
	
	
	

