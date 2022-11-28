<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Cloud;
use App\Models\UserCloudVm;
use App\Models\UserToolVm;
use App\Jobs\Google\ActionStop;
use App\Jobs\Google\ToolStart;
use App\Jobs\Google\ToolStop;
use Illuminate\Support\Facades\Storage;
class CloudController extends Controller
{
	public function monitor()
    {
      return view('admin.cloud.monitor', [
            'tasks' => UserCloudVm::where('status','!=','terminated')->orderBy('updated_at','DESC')->paginate(20)
        ]);

	
    }
	
		public function monitor_tools()
    {
      return view('admin.cloud.tools.monitor', [
            'tasks' => UserToolVm::where('status','!=','terminated')->orderBy('updated_at','DESC')->paginate(20)
        ]);

	
    }
	
	
	
	public function update_cloud_task($task_id)
	{
		$user_vm=UserCloudVm::find($task_id);
		$user_vm->status="tostop";
		$user_vm->progress=100;
		$user_vm->save();
		$user_vm->touch();
		//TODO another type of cloud
		ActionStop::dispatch($user_vm)->onQueue('google');
		return redirect()->back();
	}
	
		public function update_tool_task($task_id)
	{
		$toolVm=UserToolVm::find($task_id);
		$toolVm->status="tostop";
		$toolVm->progress=100;
		$toolVm->save();
		$toolVm->touch();
		//TODO another type of cloud
		ToolStop::dispatch($toolVm)->onQueue('google');
		return redirect()->back();
	}
	
	public function get($id=null)
    {
		if(is_null($id))
			return view('cloud.get',['cloud' =>Cloud::first()]);
		else
			return view('cloud.get',['cloud' =>Cloud::findOrFail($id)]);
    }
	
	
	
	public function update(Request $request)
	{
		$validated = $request->validate([
			'name' => 'required',
			'project' => 'required'
		]);
		
		
		$cloud=Cloud::findOrFail($request->input('id'));
			if ($cloud !== null) {
				return $this->modify($request,$cloud);
			}
	
		
	}
	
	
	public function create(Request $request)
	{
		$validated = $request->validate([
			'name' => 'required',
			'project' => 'required'
		]);

		$cloud=new Cloud;
		
		return $this->modify($request,$cloud);
	}
	
	private function modify(Request $request, $cloud)
	{
		if($request->hasFile('keyfile'))
		{
			$path = $request->file('keyfile')->storeAs('keys', $cloud->id.".json");
			$cloud->path=$path;
		}
		
		$cloud->name=$request->input('name');
		$cloud->project=$request->input('project');
		
		$cloud->save();
		

			return redirect()->route('cloud');
	}



}
	
	
	
	
	
	

