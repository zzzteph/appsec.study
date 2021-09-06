<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Cloud;
use App\Models\UserCloudVm;
use App\Jobs\Yandex\ActionStop;
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
		//TODO another type of cloud
		ActionStop::dispatch($user_vm)->onQueue('yandex');
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
			'folder_id' => 'required',
			'subnet_id' => 'required',
			'platform_id' => 'required',
			'zone_id' => 'required',
			'vms_count' => 'required',
			'service_account_id' => 'required',
			'key_id' => 'required',
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
			'folder_id' => 'required',
			'subnet_id' => 'required',
			'platform_id' => 'required',
			'zone_id' => 'required',
			'vms_count' => 'required',
			'service_account_id' => 'required',
			'key_id' => 'required',
		]);

		$cloud=new Cloud;
		
		return $this->modify($request,$cloud);
	}
	
	private function modify(Request $request, $cloud)
	{
		
		
		$cloud->name=$request->input('name');
		$cloud->save();
				$cloud->set_config('service_account_id',$request->input('service_account_id'));
		$cloud->set_config('key_id',$request->input('key_id'));
		$cloud->set_config('folder_id',$request->input('folder_id'));
		$cloud->set_config('subnet_id',$request->input('subnet_id'));
		$cloud->set_config('platform_id',$request->input('platform_id'));
		$cloud->set_config('zone_id',$request->input('zone_id'));
		$cloud->set_config('vms_count',$request->input('vms_count'));

			return redirect()->route('cloud');
	}



}
	
	
	
	
	
	

