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
	
	public function list()
    {
		
		$topics=Topic::orderBy('order', 'asc')->get();

		return view('admin.content.topics.list',['topics'=>$topics]);
    }
	
	public function new()
    {
		return view('admin.content.topics.new');
    }
	
	
	
	public function edit($topic_id)
    {
		return view('admin.content.topics.edit',['topic' =>Topic::findOrFail($topic_id)]);
    }
	
	
	public function update(Request $request,$topic_id)
	{
	
				$validated = $request->validate([
			'name' => 'required|max:64|min:4',
			'description' => 'required'
		]);
	
	
		$topic=Topic::findOrFail($topic_id);
		
			$topic->name=$request->input('name');

			$topic->description=$request->input('description');
		if($request->filled('published'))
			$topic->published=TRUE;
		else
			$topic->published=FALSE;
		$topic->save();
		return redirect()->route('admin-list-topics');
	

	}
	
	
	public function create(Request $request)
	{
		$request->validate([
			'name' => 'required|max:64|min:4',
			'structure' => 'required',
			'description' => 'required'
		]);

		$topic=new Topic;
		$topic->name=$request->input('name');
		$topic->description=$request->input('description');
		if($request->filled('published'))
			$topic->published=TRUE;
		else
			$topic->published=FALSE;
		$topic->structure=$request->input('structure');
		$topic->save();
		return redirect()->route('admin-list-topics');
	}
	


	public function delete(Request $request,$topic_id)
	{	
		 Topic::where('id', $topic_id)->delete();
		return redirect()->route('admin-list-topics');
	}

	
	
	public function decrease($topic_id)
	{
		$topic=Topic::findOrFail($topic_id);
		if($topic->order>0)
		$topic->order=$topic->order-1;
		
		$topic->save();
		return redirect()->route('admin-list-topics');
	}

	
	public function increase($topic_id)
	{
		
		$topic=Topic::findOrFail($topic_id);
		$topic->order=$topic->order+1;
		
		$topic->save();
		return redirect()->route('admin-list-topics');
	}

}
	
	
	
	
	
	

