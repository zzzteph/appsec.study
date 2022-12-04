<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\TopicNode;
use App\Models\UserTopicNode;
use App\Models\Lesson;
use App\Models\TheoryLesson;
use App\Models\LabLesson;
use App\Models\Vm;
use App\Models\LabLessonQuestion;
use App\Models\UserCloudVm;
use App\Models\UserToolVm;


use App\Rest\Google\Instance\GetInstance;
use App\Rest\Google\Instance\CreateInstance;
use App\Rest\Google\Instance\DeleteInstance;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Bus;
use Carbon\Carbon;
class TaskController extends Controller
{


	function can_start()
	{
		$vms = UserCloudVm::where("user_id",Auth::id())->where('created_at', '>=', Carbon::now()->subDays(1)->toDateTimeString())->get();
		$count=0;
		foreach($vms as $vm)
		{
				$count+=$vm->updated_at->diffInSeconds($vm->created_at);
		}

		if($count>6*3600)return FALSE;
		return TRUE;
	}



	public function start(Request $request,$node_id)
	{
		$node = TopicNode::where('id',$node_id)->firstOrFail();
		$topic = Topic::where('id',$node->topic_id)->firstOrFail();
		$lab_lesson = LabLesson::where('lesson_id',$node->lesson->id)->firstOrFail();
		$hasAccess=false;
		foreach($topic->user_route() as $route)
		{
			if($route->id==$node->id)$hasAccess=true;
		}
		if(!$topic->published)$hasAccess=false;
		if(Auth::user()->admin)$hasAccess=true;
		if(!$hasAccess)
		{
			return redirect()->back()->withErrors('You have no access to this lesson');
		}


		$cloud=Cloud::first();
		if($cloud===null)
		{
			return redirect()->back()->withErrors('Unable to start task. Unable to locate cloud');
		}

		if(!$this->can_start())
		{
				return redirect()->back()->withErrors('You worked pretty hard. Please wait until tomorrow');
		}


		if(Auth::user()->current_user_lab_vm()==null)
		{
			
				$userLabVm=new UserCloudVm;
				$userLabVm->user_id=Auth::user()->id;
				$userLabVm->template_id=$lab_lesson->vm->image;
				$userLabVm->topic_node_id=$node->id;
				$userLabVm->vm_id=$lab_lesson->vm->id;
				$userLabVm->ip="";
				$userLabVm->instance_id="";
				$userLabVm->cloud_id=$cloud->id;
				$userLabVm->progress=0;
				$userLabVm->save();

				Bus::chain([			new ActionStart($userLabVm,$cloud)		])->onQueue('google')->dispatch($userLabVm,$cloud);


		}

		return redirect()->back();

	}


	public function stop(Request $request,$node_id)
	{


		$node = TopicNode::where('id',$node_id)->firstOrFail();
		$topic = Topic::where('id',$node->topic_id)->firstOrFail();
		$lab_lesson = LabLesson::where('lesson_id',$node->lesson->id)->firstOrFail();
		$hasAccess=false;
		foreach($topic->user_route() as $route)
		{
			if($route->id==$node->id)$hasAccess=true;
		}
		if(!$topic->published)$hasAccess=false;
		if(Auth::user()->admin)$hasAccess=true;
		if(!$hasAccess)
		{
			return redirect()->back()->withErrors('You have no access to this lesson');
		}



		$userLabVm=Auth::user()->current_user_lab_vm();
		if($userLabVm==null)
		{
				return redirect()->back()->withErrors('Task not found');
		}

		if($userLabVm->status!='running')
		{
			return redirect()->back()->withErrors('Task can not be stopped');
		}

		$userLabVm->status="tostop";
		$userLabVm->progress=100;
		$userLabVm->save();
		ActionStop::dispatch($userLabVm)->onQueue('google');
		return redirect()->back();

	}




}
