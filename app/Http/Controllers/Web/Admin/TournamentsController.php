<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
class TournamentsController extends Controller
{
	
	public function list()
    {
		
		$topics=Topic::where('type','tournament')->orderBy('order', 'asc')->get();

		return view('admin.content.tournaments.list',['topics'=>$topics]);
    }
	
	public function new()
    {
		return view('admin.content.tournaments.new');
    }
	
	
	
	public function edit($topic_id)
    {
		return view('admin.content.tournaments.edit',['topic' =>Topic::where('type','tournament')->findOrFail($topic_id)]);
    }
	
	
	public function update(Request $request,$topic_id)
	{
	
				$validated = $request->validate([
			'name' => 'required|max:64|min:4',
			'description' => 'required',
			'start_at' => 'required|date',
			'ends_at' => 'required|date'
		]);
		$topic=Topic::findOrFail($topic_id);
		if($topic->type='tournament')
		{
			if(Carbon::now()->diffInDays($topic->start_at)<=0 && $topic->published==true)
			{
				return back()->withErrors(['error' => 'Tournament already started. You can only delete it.']);
			}
		}
		
		
		
			
		
		$topic->name=$request->input('name');
		$topic->start_at=$request->input('start_at');
		$topic->ends_at=$request->input('ends_at');
		$topic->description=$request->input('description');
		if($request->filled('published'))
			$topic->published=TRUE;
		else
			$topic->published=FALSE;
		$topic->type='tournament';
		$topic->save();
		return redirect()->route('admin-list-tournaments');
	

	}
	
	
	public function create(Request $request)
	{
		$request->validate([
			'name' => 'required|max:64|min:4',
			'structure' => 'required',
			'description' => 'required',
			'start_at' => 'required|date',
			'ends_at' => 'required|date'
		]);

		$topic=new Topic;
		$topic->name=$request->input('name');
		$topic->description=$request->input('description');
		$topic->start_at=$request->input('start_at');
		$topic->ends_at=$request->input('ends_at');
		if($request->filled('published'))
			$topic->published=TRUE;
		else
			$topic->published=FALSE;
		$topic->structure=$request->input('structure');
		$topic->type='tournament';
		$topic->save();
		return redirect()->route('admin-list-tournaments');
	}
	


	public function delete(Request $request,$topic_id)
	{	
		 Topic::where('id', $topic_id)->delete();
		return redirect()->route('admin-list-tournaments');
	}

	


}
	
	
	
	
	
	

