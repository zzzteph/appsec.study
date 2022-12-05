<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Cloud;
use App\Models\CloudConfig;
use App\Models\UserCloudVm;
use App\Jobs\StopVM;
use Illuminate\Support\Facades\Storage;
class CloudController extends Controller
{
	public function monitor()
    {
      return view('admin.cloud.monitor', [
            'tasks' => UserCloudVm::where('status','!=','terminated')->orderBy('updated_at','DESC')->paginate(20)
        ]);

	
    }
	

	
	
	public function update_cloud_task($task_id)
	{
		$user_vm=UserCloudVm::find($task_id);
		$user_vm->status="tostop";
		$user_vm->progress=100;
		$user_vm->save();
		$user_vm->touch();
		StopVM::dispatch($user_vm);
		return redirect()->back();
	}
	
	
	
	
	
	
	public function view()
    {

		return view('admin.cloud.view',['cloud' =>Cloud::first()]);

    }
	
	
	
	public function update(Request $request)
	{
		$request->validate(['type' => 'required']);
		
		
		$cloud=Cloud::first();
		if($cloud->type=='google')
			return $this->modify($request,$cloud);
		
	}
	
	
	public function create(Request $request)
	{
		$request->validate(['type' => 'required']);
		$cloud=new Cloud;
		
		$cloud->type='google';
		$cloud->save();
		
		if($cloud->type=='google')
			return $this->modify($request,$cloud);
	}
	
	private function modify(Request $request, $cloud)
	{
		

		$request->validate([
		'project' => 'required|max:255',
		'machine' => 'required|max:255',
		'zone' => 'required|max:255',
		'network' => 'required|max:255',
		'keyfile' => 'required|file'
		]);
		CloudConfig::truncate();
		
		$config=new CloudConfig;
		$config->name="project";
		$config->cloud_id=$cloud->id;
		$config->value=$request->input('project');
		$config->save();
		
		
		$config=new CloudConfig;
		$config->name="machine";
		$config->cloud_id=$cloud->id;
		$config->value=$request->input('machine');
		$config->save();
		
		
		$config=new CloudConfig;
		$config->name="zone";
		$config->cloud_id=$cloud->id;
		$config->value=$request->input('zone');
		$config->save();
		
		
		$config=new CloudConfig;
		$config->name="network";
		$config->cloud_id=$cloud->id;
		$config->value=$request->input('network');
		$config->save();
		
		
		$path = $request->file('keyfile')->storeAs('keys', "google.json");
		$config=new CloudConfig;
		$config->name="keyfile";
		$config->cloud_id=$cloud->id;
		$config->value=Storage::path($path);
		$config->save();

	
			return back();
	}
	
	
	
	
	
	
	
	
}
	
	
	
	
	
	

