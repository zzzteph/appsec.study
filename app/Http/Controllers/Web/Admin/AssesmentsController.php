<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Assessment;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
class AssesmentsController extends Controller
{
	
	public function list()
    {
		
		$assessments=Assessment::all();

		return view('admin.content.assessments.list',['assessments'=>$assessments]);
    }
	
	public function new()
    {
		return view('admin.content.assessments.new');
    }
	
	
	
	public function edit($topic_id)
    {
		return view('admin.content.tournaments.edit',['topic' =>Topic::where('type','tournament')->findOrFail($topic_id)]);
    }
	
	
	public function update(Request $request,$topic_id)
	{
	
			$validated = $request->validate([
			'name' => 'required|max:64|min:4',
			'duration' => 'required',
			'limit'=>'required',
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
			'duration' => 'required',
		]);

if($request->filled('can_expire'))
{
		$request->validate([
			'starts_at' => 'required|date',
			'ends_at' => 'required|date'
		]);
}
if($request->filled('randomize'))
{
				$request->validate([
			'limit' => 'required'
		]);
}

if($request->filled('time_limit'))
{
				$request->validate([
			'duration' => 'required'
		]);
}

		$assessment=new Assessment;
		$assessment->name=$request->input('name');
		$assessment->count=$request->input('limit');
		$assessment->duration=$request->input('duration');
		
		if($request->filled('can_expire'))
			$assessment->randomize=1;
		else
			$assessment->randomize=0;
		
		
		$assessment->starts_at=$request->input('starts_at');
		$assessment->ends_at=$request->input('ends_at');
		$assessment->link=Str::random(40);
		if($request->filled('randomize'))
			$assessment->randomize=1;
		else
			$assessment->randomize=0;
		
		$assessment->save();
		return redirect()->route('admin-list-assessments');
	}
	


	public function delete(Request $request,$topic_id)
	{	
		 Topic::where('id', $topic_id)->delete();
		return redirect()->route('admin-list-tournaments');
	}

	


}
	
	
	
	
	
	

