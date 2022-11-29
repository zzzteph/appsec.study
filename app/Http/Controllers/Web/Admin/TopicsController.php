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
	
		$topic=Topic::findOrFail($topic_id);
		if (!$request->filled('name')) 
		 return back()->withErrors([
            'message' => 'You must set at least the name',
        ]);

				return $this->modify($request,$topic);

	}
	
	
	public function create(Request $request)
	{
		if (!$request->filled('name')) 
		 return back()->withErrors([
            'message' => 'You must set at least the name',
        ]);
		$topic=new Topic;
		return $this->modify($request,$topic);
	}
	
	private function modify(Request $request, $topic)
	{
		
		if($request->filled('name'))
			$topic->name=$request->input('name');
		if($request->filled('description'))
			$topic->description=$request->input('description');
		if($request->filled('published'))
			$topic->published=TRUE;
		else
		$topic->published=FALSE;
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
	
	
	
	
	
	

